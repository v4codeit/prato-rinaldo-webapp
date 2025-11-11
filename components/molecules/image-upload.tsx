'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ImageUploadProps {
  bucket: string;
  currentImage: string | null;
  onImageChange: (image: string | null) => void;
  maxSizeMB?: number;
  label?: string;
  userId?: string;
  acceptSVG?: boolean;
}

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_WITH_SVG = [...ACCEPTED_FILE_TYPES, 'image/svg+xml'];

export function ImageUpload({
  bucket,
  currentImage,
  onImageChange,
  maxSizeMB = 5,
  label = 'Immagine',
  userId,
  acceptSVG = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const acceptedTypes = acceptSVG ? ACCEPTED_WITH_SVG : ACCEPTED_FILE_TYPES;

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      const formats = acceptSVG ? 'JPEG, PNG, WebP o SVG' : 'JPEG, PNG o WebP';
      return `Formato non supportato. Usa: ${formats}`;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Il file è troppo grande. Massimo ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const fileName = `logo-${timestamp}-${randomStr}.${fileExt}`;

      // Construct path
      const path = userId ? `${userId}/${fileName}` : `temp/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Solo una immagine

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Upload file
    setUploading(true);
    try {
      const publicUrl = await uploadFile(file);

      if (publicUrl) {
        onImageChange(publicUrl);
        toast.success('Immagine caricata con successo');
      } else {
        toast.error('Errore durante il caricamento');
      }
    } catch (error) {
      toast.error('Errore durante il caricamento');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (uploading) return;

      handleFiles(e.dataTransfer.files);
    },
    [uploading]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (uploading) return;
    handleFiles(e.target.files);
  };

  const handleDelete = async () => {
    if (!currentImage) return;

    try {
      // Extract path from URL
      const urlParts = currentImage.split('/');
      const pathIndex = urlParts.findIndex((part) => part === bucket);
      if (pathIndex !== -1) {
        const filePath = urlParts.slice(pathIndex + 1).join('/');

        // Delete from storage
        await supabase.storage.from(bucket).remove([filePath]);
      }

      onImageChange(null);
      toast.success('Immagine rimossa');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Errore durante la rimozione');
    }
  };

  const handleClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleChange}
        className="hidden"
        disabled={uploading}
      />

      {currentImage ? (
        // Preview con immagine caricata
        <Card className="relative overflow-hidden">
          <div className="relative aspect-square w-full max-w-xs mx-auto">
            <Image
              src={currentImage}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 384px"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleDelete}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        // Drop zone per upload
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            dragActive && 'border-primary bg-primary/5',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center justify-center p-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-4 mb-3">
                  {dragActive ? (
                    <Upload className="h-8 w-8 text-primary" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-primary" />
                  )}
                </div>
                <p className="text-sm font-medium mb-1">
                  {dragActive ? 'Rilascia qui' : 'Carica immagine'}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Clicca o trascina un file qui
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {maxSizeMB}MB · {acceptSVG ? 'JPEG, PNG, WebP, SVG' : 'JPEG, PNG, WebP'}
                </p>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
