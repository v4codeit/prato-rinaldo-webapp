'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, X, Loader2, FileIcon, ImageIcon } from 'lucide-react';
import { uploadProposalAttachment, deleteProposalAttachment } from '@/app/actions/storage';

interface Attachment {
  id: string;
  url: string;
  file_name: string;
  file_type: string;
}

interface ProposalAttachmentUploadProps {
  proposalId: string;
  currentAttachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxFiles?: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_SIZE_MB = 5;

export function ProposalAttachmentUpload({
  proposalId,
  currentAttachments,
  onAttachmentsChange,
  maxFiles = 5,
}: ProposalAttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check limit
    if (currentAttachments.length >= maxFiles) {
      toast.error(`Massimo ${maxFiles} allegati permessi`);
      return;
    }

    const file = files[0]; // Upload one at a time

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Tipo file non supportato. Usa immagini (JPEG, PNG, GIF, WebP) o PDF');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File troppo grande. Massimo ${MAX_SIZE_MB}MB`);
      return;
    }

    // Upload
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadProposalAttachment(formData, proposalId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Allegato caricato');
      onAttachmentsChange([
        ...currentAttachments,
        {
          id: result.attachmentId!,
          url: result.url!,
          file_name: result.fileName!,
          file_type: result.fileType!,
        },
      ]);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    const result = await deleteProposalAttachment(attachmentId);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Allegato eliminato');
      onAttachmentsChange(currentAttachments.filter((a) => a.id !== attachmentId));
    }
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {currentAttachments.length < maxFiles && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Carica Allegato ({currentAttachments.length}/{maxFiles})
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Immagini (JPEG, PNG, GIF, WebP) o PDF, massimo {MAX_SIZE_MB}MB
          </p>
        </div>
      )}

      {/* Attachments List */}
      {currentAttachments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentAttachments.map((attachment) => (
            <Card key={attachment.id} className="relative group overflow-hidden">
              <div className="aspect-square relative bg-muted">
                {isImage(attachment.file_type) ? (
                  <img
                    src={attachment.url}
                    alt={attachment.file_name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <FileIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(attachment.id)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-2">
                <p className="text-xs truncate" title={attachment.file_name}>
                  {attachment.file_name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
