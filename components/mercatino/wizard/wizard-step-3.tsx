'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { ImagePlus, X, GripVertical, Loader2, AlertCircle, ChevronDown, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils/cn';

export interface WizardStep3Data {
  images: string[];
}

interface WizardStep3Props {
  data?: Partial<WizardStep3Data>;
  onChange: (data: Partial<WizardStep3Data>) => void;
  maxImages?: number;
}

interface PendingImage {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  compressing?: boolean;
  originalSize?: number;
  compressedSize?: number;
  error?: string;
  url?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (before compression)
const MAX_COMPRESSED_SIZE = 2; // 2MB after compression
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

// Compression options
const COMPRESSION_OPTIONS = {
  maxSizeMB: MAX_COMPRESSED_SIZE,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WizardStep3({
  data,
  onChange,
  maxImages = 10,
}: WizardStep3Props) {
  const [pendingImages, setPendingImages] = React.useState<PendingImage[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isTipsOpen, setIsTipsOpen] = React.useState(false);

  // Initialize pending images from existing data
  React.useEffect(() => {
    if (data?.images?.length && pendingImages.length === 0) {
      setPendingImages(
        data.images.map((url, index) => ({
          id: `existing-${index}`,
          file: null as unknown as File,
          preview: url,
          uploading: false,
          url,
        }))
      );
    }
  }, [data?.images]);

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      pendingImages.forEach((img) => {
        if (img.preview && !img.url) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  // Update parent with uploaded URLs
  const updateParent = (images: PendingImage[]) => {
    const urls = images
      .filter((img) => img.url)
      .map((img) => img.url!);
    onChange({ images: urls });
  };

  // Handle file drop/select with compression
  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      const availableSlots = maxImages - pendingImages.length;
      const filesToAdd = acceptedFiles.slice(0, availableSlots);

      if (filesToAdd.length === 0) return;

      setIsUploading(true);

      // Process each file
      for (const file of filesToAdd) {
        const pendingId = crypto.randomUUID();
        const originalSize = file.size;

        // Create pending entry with compressing state
        const newPending: PendingImage = {
          id: pendingId,
          file,
          preview: URL.createObjectURL(file),
          uploading: false,
          compressing: true,
          originalSize,
        };

        setPendingImages((prev) => [...prev, newPending]);

        try {
          // Step 1: Compress image
          const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
          const compressedSize = compressedFile.size;

          // Update state: compression done, start upload
          setPendingImages((prev) =>
            prev.map((img) =>
              img.id === pendingId
                ? {
                    ...img,
                    file: compressedFile,
                    compressing: false,
                    uploading: true,
                    compressedSize,
                  }
                : img
            )
          );

          // Step 2: Upload compressed file
          const { uploadMarketplaceImage } = await import('@/app/actions/storage');

          const formData = new FormData();
          formData.append('file', compressedFile);

          const result = await uploadMarketplaceImage(formData);

          if ('error' in result) {
            setPendingImages((prev) =>
              prev.map((img) =>
                img.id === pendingId
                  ? { ...img, uploading: false, error: result.error }
                  : img
              )
            );
          } else {
            setPendingImages((prev) => {
              const updated = prev.map((img) =>
                img.id === pendingId
                  ? { ...img, uploading: false, url: result.url }
                  : img
              );
              updateParent(updated);
              return updated;
            });
          }
        } catch (err) {
          setPendingImages((prev) =>
            prev.map((img) =>
              img.id === pendingId
                ? {
                    ...img,
                    compressing: false,
                    uploading: false,
                    error: err instanceof Error ? err.message : 'Errore durante la compressione',
                  }
                : img
            )
          );
        }
      }

      setIsUploading(false);
    },
    [pendingImages.length, maxImages, onChange]
  );

  // Remove image
  const removeImage = (id: string) => {
    setPendingImages((prev) => {
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove?.preview && !toRemove.url) {
        URL.revokeObjectURL(toRemove.preview);
      }

      const updated = prev.filter((img) => img.id !== id);
      updateParent(updated);
      return updated;
    });
  };

  // Reorder images (drag and drop)
  const moveImage = (fromIndex: number, toIndex: number) => {
    setPendingImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      updateParent(updated);
      return updated;
    });
  };

  // Dropzone config
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    disabled: pendingImages.length >= maxImages || isUploading,
    multiple: true,
  });

  const uploadedCount = pendingImages.filter((img) => img.url).length;
  const hasError = pendingImages.some((img) => img.error);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">
            Foto dell'annuncio
          </Label>
          <p className="text-sm text-slate-500 mt-1">
            Aggiungi fino a {maxImages} foto. La prima sarà la foto principale.
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {uploadedCount}/{maxImages}
        </span>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer",
          isDragActive
            ? "border-emerald-500 bg-emerald-50"
            : pendingImages.length >= maxImages
              ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-50"
              : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              isDragActive ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            <ImagePlus className="w-7 h-7" />
          </div>

          <div>
            <p className="font-medium text-slate-900">
              {isDragActive
                ? "Rilascia le immagini qui"
                : "Trascina le immagini qui"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              oppure clicca per selezionarle
            </p>
          </div>

          <p className="text-xs text-slate-400">
            JPG, PNG o WebP • Max 10MB • Compresse automaticamente
          </p>
        </div>
      </div>

      {/* Image Grid */}
      {pendingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {pendingImages.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden bg-slate-100 group",
                index === 0 && "ring-2 ring-emerald-500 ring-offset-2"
              )}
            >
              {/* Image */}
              <img
                src={image.preview}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Compressing Overlay */}
              {image.compressing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 p-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">Ottimizzando...</p>
                    {image.originalSize && (
                      <p className="text-xs text-white/80 mt-1">
                        {formatFileSize(image.originalSize)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Uploading Overlay */}
              {image.uploading && !image.compressing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 p-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">Caricamento...</p>
                    {image.originalSize && image.compressedSize && (
                      <p className="text-xs text-emerald-400 mt-1">
                        {formatFileSize(image.originalSize)} → {formatFileSize(image.compressedSize)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Overlay */}
              {image.error && (
                <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-2">
                  <AlertCircle className="w-6 h-6 text-white mb-1" />
                  <p className="text-xs text-white text-center">{image.error}</p>
                </div>
              )}

              {/* Controls */}
              {!image.uploading && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Primary Badge */}
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                      Principale
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collapsible Tips */}
      <Collapsible open={isTipsOpen} onOpenChange={setIsTipsOpen}>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left group">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h4 className="font-medium text-slate-900">
                  Consigli per foto migliori
                </h4>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-slate-500 transition-transform duration-200",
                  isTipsOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <div className="pl-10 pr-2">
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Scatta in buona luce naturale (evita flash diretto)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Inquadra l'oggetto intero e da vicino</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Mostra eventuali difetti per trasparenza</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Usa sfondo neutro e pulito</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Aggiungi foto da più angolazioni (min. 3 consigliate)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="font-medium">La prima foto sarà l'anteprima principale</span>
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-emerald-600">✓ Ottimizzazione automatica:</span>{' '}
                    Le tue foto verranno compresse automaticamente per un caricamento più veloce,
                    mantenendo un'ottima qualità visiva.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* Validation Message */}
      {uploadedCount === 0 && (
        <p className="text-sm text-amber-600">
          ⚠️ Aggiungi almeno una foto per continuare
        </p>
      )}
    </div>
  );
}
