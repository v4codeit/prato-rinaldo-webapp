'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  bucket: string;
  currentImages: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  label?: string;
  userId?: string;
  itemId?: string;
}

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function MultiImageUpload({
  bucket,
  currentImages,
  onImagesChange,
  maxImages = 6,
  maxSizeMB = 10,
  label = 'Immagini',
  userId,
  itemId,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return `Formato non supportato. Usa: JPEG, PNG o WebP`;
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
      const fileName = `image-${timestamp}-${randomStr}.${fileExt}`;

      // Construct path
      const path = userId && itemId
        ? `${userId}/${itemId}/${fileName}`
        : `temp/${fileName}`;

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
    } catch (error: any) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check max images limit
    const remainingSlots = maxImages - currentImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Massimo ${maxImages} immagini permesse`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    // Validate all files first
    for (const file of filesToUpload) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    setUploading(true);

    try {
      // Upload files in parallel
      const uploadPromises = filesToUpload.map(file => uploadFile(file));
      const results = await Promise.all(uploadPromises);

      // Filter successful uploads
      const successfulUploads = results.filter((url): url is string => url !== null);

      if (successfulUploads.length === 0) {
        toast.error('Errore durante il caricamento delle immagini');
        return;
      }

      // Update images array
      const newImages = [...currentImages, ...successfulUploads];
      onImagesChange(newImages);

      toast.success(`${successfulUploads.length} immagine/i caricate con successo`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Errore durante il caricamento');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [currentImages, maxImages]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = currentImages[index];

    // Optionally delete from storage
    // Note: We might want to keep images until item is deleted
    // to avoid issues with draft edits

    const newImages = currentImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('Immagine rimossa');
  };

  const canAddMore = currentImages.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors',
            dragActive && 'border-primary bg-primary/5',
            !dragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES.join(',')}
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Trascina le immagini qui o{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline"
                    >
                      sfoglia
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG o WebP (max {maxSizeMB}MB per file)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentImages.length} / {maxImages} immagini caricate
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Image Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentImages.map((imageUrl, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={imageUrl}
                  alt={`Immagine ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />

                {/* First image indicator */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
                    Copertina
                  </div>
                )}

                {/* Remove button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Image number */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {currentImages.length === 0 && !canAddMore && (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nessuna immagine caricata
            </p>
          </div>
        </Card>
      )}

      {/* Help text */}
      {currentImages.length > 0 && (
        <p className="text-xs text-muted-foreground">
          La prima immagine sarà usata come copertina. Trascina per riordinare (funzionalità futura).
        </p>
      )}
    </div>
  );
}
