import { notFound } from 'next/navigation';
export default async function PreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { PreviewDashboard } = await import('~/preview/PreviewDashboard');
  return <PreviewDashboard />;
}
