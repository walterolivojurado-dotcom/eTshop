import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  return NextResponse.json({
    name: 'eTshop — Sistema POS',
    short_name: 'eTshop',
    description: 'Plataforma Multi-Tenant de Punto de Venta, Inventario y Facturación',
    start_url: `/b/${slug}`,
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#10b981',
    scope: `/b/${slug}/`,
    icons: [
      {
        src: '/icon-192.png?v=2',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  });
}
