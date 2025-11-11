'use client';

import * as React from 'react';
import { RichTextEditor } from '@/components/organisms/editor/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function TestEditorClient() {
  const [content, setContent] = React.useState('<p>Ciao! Prova a scrivere qualcosa...</p>');
  const [showPreview, setShowPreview] = React.useState(false);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Rich Text Editor</h1>
          <p className="text-muted-foreground">
            Prova l'editor TipTap con tutti i formattazioni disponibili
          </p>
        </div>
        <Button onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? 'Nascondi Anteprima' : 'Mostra Anteprima'}
        </Button>
      </div>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Inizia a scrivere..."
            minHeight="500px"
          />
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Anteprima HTML</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs">{content}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rendered Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Rendering</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Istruzioni di Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Formattazione Testo:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Grassetto: Ctrl+B o pulsante toolbar</li>
              <li>Corsivo: Ctrl+I o pulsante toolbar</li>
              <li>Barrato: pulsante toolbar</li>
              <li>Codice inline: pulsante toolbar</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Titoli:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>H1, H2, H3 disponibili tramite toolbar</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Liste:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Elenco puntato e numerato</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Blocchi:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Citazione (blockquote)</li>
              <li>Blocco di codice con syntax highlighting</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Inserimenti:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Link: seleziona testo e clicca icona link</li>
              <li>Immagine: carica file (max 5MB) o inserisci URL</li>
              <li>Formati supportati: JPEG, PNG, WebP, SVG</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Undo/Redo:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Annulla: Ctrl+Z</li>
              <li>Ripeti: Ctrl+Shift+Z</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
