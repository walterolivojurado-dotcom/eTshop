'use client';

import { useEffect } from 'react';
import { useBranding } from '@/hooks/use-branding';

/**
 * Componente que se encarga de aplicar la clase de tema al elemento <html>
 * basándose en la configuración de Branding actual.
 */
export function ThemeInitializer() {
  const { branding } = useBranding();
  const themeId = branding?.settings?.theme || 'default';

  useEffect(() => {
    console.log(`[ThemeSystem] Initializing theme: ${themeId}`);
    
    const html = document.documentElement;
    // 1. Limpiar todos los temas anteriores de <html>
    const themeClasses = Array.from(html.classList).filter(c => c.startsWith('theme-'));
    console.log(`[ThemeSystem] Removing old classes:`, themeClasses);
    themeClasses.forEach(c => html.classList.remove(c));

    // 2. Aplicar el nuevo tema
    const newClass = `theme-${themeId}`;
    html.classList.add(newClass);
    
    // Log para depuración
    console.log(`[ThemeSystem] New theme applied to DOM: ${newClass}`);
    console.log(`[ThemeSystem] Computed Primary Color for body:`, getComputedStyle(document.body).getPropertyValue('--primary'));
    
  }, [themeId]);

  return null; // No renderiza nada visualmente
}
