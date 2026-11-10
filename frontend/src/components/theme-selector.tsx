'use client';

import { THEMES } from '@/lib/themes';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ThemeSelectorProps {
  currentTheme: string;
  onSelect: (themeId: string) => void;
}

export function ThemeSelector({ currentTheme, onSelect }: ThemeSelectorProps) {
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Efecto para el Live Preview (aplica la clase al html temporalmente)
  useEffect(() => {
    const activeTheme = previewTheme || currentTheme || 'default';
    const html = document.documentElement;
    
    // Limpiar clases de tema previas
    const themeClasses = Array.from(html.classList).filter(c => c.startsWith('theme-'));
    themeClasses.forEach(c => html.classList.remove(c));

    // Aplicar el tema activo (ya sea el real o el preview)
    html.classList.add(`theme-${activeTheme}`);
    
    return () => {
      // Al desmontar, nos aseguramos de no dejar clases de preview "huérfanas"
    };
  }, [previewTheme, currentTheme]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {THEMES.map((theme) => {
        const isActive = (previewTheme || currentTheme) === theme.id;
        const isSelected = currentTheme === theme.id;

        return (
          <div
            key={theme.id}
            className={cn(
              "relative cursor-pointer group rounded-xl border p-3 transition-all duration-200 hover:shadow-md overflow-hidden",
              isSelected 
                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                : "border-border hover:border-primary/40 bg-card"
            )}
            onClick={() => onSelect(theme.id)}
            onMouseEnter={() => setPreviewTheme(theme.id)}
            onMouseLeave={() => setPreviewTheme(null)}
          >
            {/* Cabecera Compacta */}
            <div className="flex flex-col gap-2">
              <span 
                className={cn("text-xs font-bold truncate leading-tight", isSelected && "text-primary")} 
                style={{ fontFamily: theme.fontFamily }}
              >
                {theme.name}
              </span>
              
              {/* Colores en una línea sutil */}
              <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-muted/20">
                <div style={{ backgroundColor: theme.colors.primary }} className="flex-[2]" />
                <div style={{ backgroundColor: theme.colors.accent }} className="flex-1" />
                <div style={{ backgroundColor: theme.colors.background }} className="flex-1 border-l border-black/5" />
              </div>

              {/* Muestra de Fuente Pequeña */}
              <div 
                className="text-[9px] opacity-40 group-hover:opacity-100 transition-opacity truncate"
                style={{ fontFamily: theme.fontFamily }}
              >
                Tipografía Premium
              </div>
            </div>

            {/* Check sutil */}
            {isSelected && (
              <div className="absolute top-1 right-1">
                <Check className="w-3 h-3 text-primary" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
