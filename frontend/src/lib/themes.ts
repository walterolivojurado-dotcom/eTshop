export interface ThemeMetadata {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    background: string;
    accent: string;
  };
  fontFamily: string;
}

export const THEMES: ThemeMetadata[] = [
  {
    id: 'default',
    name: 'Default Elegance',
    description: 'Estética corporativa, marfil y azul profesional con Inter.',
    colors: { primary: '#354eba', background: '#fdfdfc', accent: '#d4af37' },
    fontFamily: 'Inter'
  },
  {
    id: 'sakura',
    name: 'Soft Sakura',
    description: 'Tonos pasteles con la limpieza de Geist.',
    colors: { primary: '#fca5d9', background: '#fff5f9', accent: '#a5fca5' },
    fontFamily: 'Geist'
  },
  {
    id: 'barber',
    name: 'Lavanda Suave',
    description: 'Morado lavanda pastel con tipografía Geist.',
    colors: { primary: '#9b87d4', background: '#f9f7ff', accent: '#d4c5f9' },
    fontFamily: 'Geist'
  },
  {
    id: 'medical',
    name: 'Clean Medical',
    description: 'Máxima claridad y confianza con Inter.',
    colors: { primary: '#4facfe', background: '#ffffff', accent: '#00f2fe' },
    fontFamily: 'Inter'
  },
  {
    id: 'midnight',
    name: 'Citrus Fresco',
    description: 'Naranja cítrico brillante con el toque moderno de Montserrat.',
    colors: { primary: '#f97316', background: '#fffbf5', accent: '#fde68a' },
    fontFamily: 'Montserrat'
  },
  {
    id: 'nature',
    name: 'Nature Fresh',
    description: 'Verde bosque y crema equilibrados con Work Sans.',
    colors: { primary: '#2d5a27', background: '#fcfcf0', accent: '#8fb339' },
    fontFamily: 'Work Sans'
  },
  {
    id: 'cyber',
    name: 'Cedro & Madera',
    description: 'Ambiente acogedor y artesanal con Roboto.',
    colors: { primary: '#92400e', background: '#fdf8f3', accent: '#d97706' },
    fontFamily: 'Roboto'
  },
  {
    id: 'vintage',
    name: 'Vintage Royal',
    description: 'Prestigio tradicional con la modernidad de Geist.',
    colors: { primary: '#800000', background: '#f5f5dc', accent: '#b8860b' },
    fontFamily: 'Geist'
  },
  {
    id: 'blue-harmony',
    name: 'Blue Harmony',
    description: 'Azul profesional y grises armónicos con Inter.',
    colors: { primary: '#2563eb', background: '#f8fafc', accent: '#64748b' },
    fontFamily: 'Inter'
  },
  {
    id: 'chic-nails',
    name: 'Chic Nails',
    description: 'Elegancia Rose Gold y Perla con Montserrat.',
    colors: { primary: '#e11d48', background: '#fff7ed', accent: '#fbbf24' },
    fontFamily: 'Montserrat'
  },
  {
    id: 'menta',
    name: 'Menta Fresca',
    description: 'Equilibrio de bienestar moderno con Work Sans.',
    colors: { primary: '#10b981', background: '#f0fdf9', accent: '#6ee7b7' },
    fontFamily: 'Work Sans'
  },
  {
    id: 'coral',
    name: 'Durazno Coral',
    description: 'Calidez y cercanía con Montserrat.',
    colors: { primary: '#fb7185', background: '#fff5f5', accent: '#fcd9bd' },
    fontFamily: 'Montserrat'
  },
  {
    id: 'cielo',
    name: 'Cielo Pastel',
    description: 'Paz y luminosidad con Work Sans.',
    colors: { primary: '#38bdf8', background: '#f0f9ff', accent: '#bae6fd' },
    fontFamily: 'Work Sans'
  },
  {
    id: 'lino',
    name: 'Lino Natural',
    description: 'Minimalismo rústico equilibrado con Roboto.',
    colors: { primary: '#a16207', background: '#fefce8', accent: '#fde68a' },
    fontFamily: 'Roboto'
  },
  {
    id: 'cereza',
    name: 'Cereza Pastel',
    description: 'Femenino y encantador con Roboto.',
    colors: { primary: '#ec4899', background: '#fef3f8', accent: '#fbcfe8' },
    fontFamily: 'Roboto'
  },
  {
    id: 'executive',
    name: 'Executive Navy',
    description: 'Azul medianoche profundo con Inter.',
    colors: { primary: '#1e3a8a', background: '#ffffff', accent: '#9ca3af' },
    fontFamily: 'Inter'
  },
  {
    id: 'minimalist',
    name: 'Pure Minimalist',
    description: 'Vanguardia tecnológica con Geist.',
    colors: { primary: '#171717', background: '#fafafa', accent: '#404040' },
    fontFamily: 'Geist'
  },
  {
    id: 'clinic',
    name: 'Modern Clinic',
    description: 'Bienestar moderno con Montserrat.',
    colors: { primary: '#2dd4bf', background: '#ffffff', accent: '#f1f5f9' },
    fontFamily: 'Montserrat'
  },
  {
    id: 'luxury',
    name: 'Luxury Gold',
    description: 'Altísimo prestigio con Montserrat.',
    colors: { primary: '#b45309', background: '#171717', accent: '#fefce8' },
    fontFamily: 'Montserrat'
  },
  {
    id: 'corporate',
    name: 'Corporate Slate',
    description: 'Gestión administrativa con Work Sans.',
    colors: { primary: '#2563eb', background: '#f8fafc', accent: '#64748b' },
    fontFamily: 'Work Sans'
  },
  {
    id: 'emerald',
    name: 'Emerald Professional',
    description: 'Equilibrio natural y formal con Inter.',
    colors: { primary: '#065f46', background: '#fdfbf7', accent: '#a8a29e' },
    fontFamily: 'Inter'
  },
  {
    id: 'amethyst',
    name: 'Deep Amethyst',
    description: 'Exclusividad creativa con Work Sans.',
    colors: { primary: '#4c1d95', background: '#faf5ff', accent: '#ddd6fe' },
    fontFamily: 'Work Sans'
  },
  {
    id: 'coffee',
    name: 'Coffee & Cream',
    description: 'Experiencia formalmente acogedora con Roboto.',
    colors: { primary: '#451a03', background: '#fafaf9', accent: '#d6d3d1' },
    fontFamily: 'Roboto'
  },
  {
    id: 'arctic',
    name: 'Arctic Silver',
    description: 'Tonos plata y azul hielo con Roboto.',
    colors: { primary: '#0284c7', background: '#f8fafc', accent: '#cbd5e1' },
    fontFamily: 'Roboto'
  },
  {
    id: 'wine',
    name: 'Boutique Wine',
    description: 'Sofisticación intensa y madura con Geist.',
    colors: { primary: '#831843', background: '#fff1f2', accent: '#171717' },
    fontFamily: 'Geist'
  }
];
