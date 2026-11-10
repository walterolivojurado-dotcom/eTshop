import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  return NextResponse.json({
    name: 'eTambook',
    short_name: 'eTambook',
    description: 'Sistema de Agendamiento Profesional High-End',
    start_url: `/b/${slug}`,
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#FFFFFF',
    scope: `/b/${slug}/`,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable' as any,
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable' as any,
      },
    ],
  });
}
