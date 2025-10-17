import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  maxSize?: number; // in MB
  accept?: string;
}

export function ImageUpload({ onUpload, maxSize = 5, accept = "image/*" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Il file è troppo grande. Dimensione massima: ${maxSize}MB`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("Il file deve essere un'immagine");
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload fallito');
      }

      const data = await response.json();
      
      // Set preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Call onUpload callback
      onUpload(data.url);
      toast.success("Immagine caricata con successo!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Errore durante il caricamento dell'immagine");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Caricamento...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clicca per caricare un'immagine
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {maxSize}MB
                </p>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}

