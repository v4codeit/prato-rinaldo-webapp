'use client';

import * as React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Code2,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';
import { uploadArticleImage } from '@/app/actions/storage';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface EditorToolbarProps {
  editor: Editor;
  isSourceView: boolean;
  onToggleSourceView: () => void;
}

// ============================================
// TOOLBAR COMPONENT
// ============================================

export function EditorToolbar({
  editor,
  isSourceView,
  onToggleSourceView,
}: EditorToolbarProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ============================================
  // LINK HANDLERS
  // ============================================

  const handleSetLink = () => {
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }
    setLinkUrl('');
    setIsLinkDialogOpen(false);
  };

  const handleOpenLinkDialog = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setIsLinkDialogOpen(true);
  };

  // ============================================
  // IMAGE HANDLERS
  // ============================================

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadArticleImage(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        editor.chain().focus().setImage({ src: result.url }).run();
        toast.success('Immagine caricata con successo');
        setIsImageDialogOpen(false);
      }
    } catch (error) {
      toast.error('Errore durante il caricamento dell\'immagine');
      console.error(error);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetImageUrl = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setIsImageDialogOpen(false);
      toast.success('Immagine inserita con successo');
    }
  };

  // ============================================
  // TOOLBAR BUTTON COMPONENT
  // ============================================

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8',
        isActive && 'bg-muted',
      )}
      title={title}
    >
      {children}
    </Button>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
        {/* Text Formatting */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            disabled={isSourceView}
            title="Grassetto (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            disabled={isSourceView}
            title="Corsivo (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            disabled={isSourceView}
            title="Barrato"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            disabled={isSourceView}
            title="Codice inline"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Headings */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            disabled={isSourceView}
            title="Titolo 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            disabled={isSourceView}
            title="Titolo 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            disabled={isSourceView}
            title="Titolo 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Lists */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            disabled={isSourceView}
            title="Elenco puntato"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            disabled={isSourceView}
            title="Elenco numerato"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Blocks */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            disabled={isSourceView}
            title="Citazione"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            disabled={isSourceView}
            title="Blocco di codice"
          >
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Insert */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={handleOpenLinkDialog}
            isActive={editor.isActive('link')}
            disabled={isSourceView}
            title="Inserisci link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setIsImageDialogOpen(true)}
            disabled={isSourceView}
            title="Inserisci immagine"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Source View Toggle */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={onToggleSourceView}
            isActive={isSourceView}
            title={isSourceView ? "Vista WYSIWYG" : "Visualizza Codice HTML"}
          >
            <FileCode className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={isSourceView || !editor.can().undo()}
            title="Annulla (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={isSourceView || !editor.can().redo()}
            title="Ripeti (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserisci Link</DialogTitle>
            <DialogDescription>
              Aggiungi un link al testo selezionato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://esempio.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSetLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSetLink}>Inserisci</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserisci Immagine</DialogTitle>
            <DialogDescription>
              Carica un'immagine o inserisci un URL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Upload from file */}
            <div className="space-y-2">
              <Label htmlFor="image-file">Carica da file</Label>
              <Input
                id="image-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
                ref={fileInputRef}
              />
              <p className="text-xs text-muted-foreground">
                Formati supportati: JPEG, PNG, WebP, SVG (max 5MB)
              </p>
            </div>

            <Separator />

            {/* Insert from URL */}
            <div className="space-y-2">
              <Label htmlFor="image-url">Oppure inserisci URL</Label>
              <Input
                id="image-url"
                type="url"
                placeholder="https://esempio.com/immagine.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={isUploadingImage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSetImageUrl();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImageDialogOpen(false)}
              disabled={isUploadingImage}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSetImageUrl}
              disabled={!imageUrl || isUploadingImage}
            >
              {isUploadingImage ? 'Caricamento...' : 'Inserisci'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
