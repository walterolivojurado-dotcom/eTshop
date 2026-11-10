import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  return {
    manifest: `/b/${slug}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "eTambook",
    },
  };
}

export default async function BusinessLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      {children}
    </>
  );
}
