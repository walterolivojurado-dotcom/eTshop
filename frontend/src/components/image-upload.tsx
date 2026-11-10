"use client";

import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api, { getFileUrl } from "@/lib/api";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande (máx 5MB)");
      return;
    }

    setIsUploading(true);
    try {
      // Compresión ligera en cliente para que el Base64 sea compacto y rápido
      const compressedFile = await new Promise<File | Blob>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = Math.round(width);
            canvas.height = Math.round(height);
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const outputType = file.type === "image/png" ? "image/png" : 
                               file.type === "image/webp" ? "image/webp" : "image/jpeg";
            
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: outputType, lastModified: Date.now() }));
              } else {
                resolve(file);
              }
            }, outputType, outputType === "image/jpeg" ? 0.8 : 0.9);
          };
          img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
      });

      const formData = new FormData();
      formData.append("file", compressedFile);

      const response = await api.post("/settings/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = response.data.data.url;
      setImgBroken(false);
      onChange(uploadedUrl);
      toast.success("Imagen cargada correctamente");
    } catch {
      toast.error("Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgBroken(false);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isLegacyBrokenPath = Boolean(value && (value.startsWith("/uploads/") || value.startsWith("uploads/")));
  const currentImageUrl = !isLegacyBrokenPath && !imgBroken ? getFileUrl(value) : undefined;

  return (
    <div className="space-y-4 w-full">
      {label && <label className="text-sm font-bold ml-1 text-foreground">{label}</label>}
      
      <div className="flex items-center gap-4">
        <div 
          className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-border group bg-muted/20 flex items-center justify-center cursor-pointer hover:border-primary transition-all shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          {currentImageUrl ? (
            <>
              <img 
                src={currentImageUrl} 
                alt="Preview" 
                className="h-full w-full object-contain p-2"
                onError={() => setImgBroken(true)}
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1">
              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            className="h-12 w-full rounded-xl border-border font-bold text-sm flex gap-2 shadow-sm hover:bg-muted/50"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 text-primary" />
            )}
            {isUploading ? "Subiendo Imagen..." : "Subir Imagen"}
          </Button>
          <p className="text-[10px] text-muted-foreground mt-2 ml-1 font-medium italic">
            PNG, JPG o WEBP (Máx. 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}
