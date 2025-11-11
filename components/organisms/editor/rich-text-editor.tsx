'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { all, createLowlight } from 'lowlight';
import { toast } from 'sonner';
import { EditorToolbar } from './editor-toolbar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import './editor-styles.css';

// Initialize lowlight with all languages
const lowlight = createLowlight(all);

// ============================================
// TYPES
// ============================================

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeight?: string;
}

// ============================================
// RICH TEXT EDITOR COMPONENT
// ============================================

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Inizia a scrivere il tuo articolo...',
  editable = true,
  className,
  minHeight = '400px',
}: RichTextEditorProps) {
  // ============================================
  // SOURCE VIEW STATE
  // ============================================
  const [isSourceView, setIsSourceView] = React.useState(false);
  const [htmlBuffer, setHtmlBuffer] = React.useState('');

  // ============================================
  // HTML VALIDATION
  // ============================================
  const validateHtml = (html: string): boolean => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const parseErrors = doc.querySelector('parsererror');
      return !parseErrors;
    } catch {
      return false;
    }
  };

  // ============================================
  // TOGGLE SOURCE VIEW
  // ============================================
  const handleToggleSourceView = () => {
    if (!isSourceView) {
      // Switching TO source view
      const currentHtml = editor?.getHTML() || '';
      setHtmlBuffer(currentHtml);
      setIsSourceView(true);
    } else {
      // Switching FROM source view - validate first
      if (!validateHtml(htmlBuffer)) {
        toast.error('HTML non valido. Controlla tag aperti/chiusi.');
        return;
      }

      try {
        editor?.commands.setContent(htmlBuffer);
        onChange(htmlBuffer);
        setIsSourceView(false);
      } catch (error) {
        toast.error('Errore durante il parsing HTML.');
        console.error('HTML parse error:', error);
      }
    }
  };

  // ============================================
  // TIPTAP EDITOR
  // ============================================
  const editor = useEditor({
    immediatelyRender: false, // Prevents SSR hydration mismatch in Next.js App Router
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block (using lowlight version)
      }),
      Image.configure({
        inline: false,
        allowBase64: false, // Force using URLs only
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 hover:text-primary/80',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg dark:prose-invert',
          'max-w-none focus:outline-none',
          'px-4 py-3',
        ),
      },
    },
    onUpdate: ({ editor }) => {
      if (!isSourceView) {
        const html = editor.getHTML();
        onChange(html);
      }
    },
  });

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-input bg-background',
        !editable && 'bg-muted',
        className,
      )}
    >
      {editable && (
        <EditorToolbar
          editor={editor}
          isSourceView={isSourceView}
          onToggleSourceView={handleToggleSourceView}
        />
      )}

      {!isSourceView ? (
        <EditorContent
          editor={editor}
          className={cn('overflow-y-auto', editable && 'min-h-[400px]')}
          style={{ minHeight: editable ? minHeight : undefined }}
        />
      ) : (
        <div className="relative">
          <Textarea
            value={htmlBuffer}
            onChange={(e) => setHtmlBuffer(e.target.value)}
            className={cn(
              'font-mono text-sm resize-none border-0 focus-visible:ring-0',
              'rounded-none',
            )}
            style={{ minHeight }}
            placeholder="<p>Codice HTML qui...</p>"
          />
          <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-muted/50">
            {htmlBuffer.length} caratteri • Vista Codice Sorgente HTML
          </div>
        </div>
      )}
    </div>
  );
}
