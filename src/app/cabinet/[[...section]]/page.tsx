import { notFound } from 'next/navigation';
import { Cabinet, cabinetSections } from '~/views/Cabinet';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ tariff?: string; id?: string }>;
}) {
  const { section = [] } = await params;
  const active = cabinetSections.find((item) => item === (section[0] || 'overview'));
  if (!active || section.length > 1) notFound();
  const { tariff, id } = await searchParams;
  return (
    <Cabinet key={active} section={active} tariff={tariff} cardID={typeof id === 'string' ? id : undefined} />
  );
}
