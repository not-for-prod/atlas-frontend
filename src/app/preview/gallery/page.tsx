import { notFound } from 'next/navigation';
export default async function GalleryPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { PreviewGallery } = await import('~/preview/PreviewGallery');
  return <PreviewGallery />;
}
