import { type Metadata } from 'next';
import { Authorization } from '~/views/Authorization';
import { parseCardCategory } from '~/entities/card';
export const metadata: Metadata = { title: 'Атлас — вход в кабинет', robots: { index: false, follow: true } };
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    tariff?: string | string[];
    authError?: string | string[];
    intent?: string | string[];
    deleted?: string | string[];
  }>;
}) {
  const { tariff, authError, intent, deleted } = await searchParams;
  return (
    <Authorization
      deleting={intent === 'delete'}
      deleted={deleted === '1'}
      category={parseCardCategory(tariff)}
      callbackError={authError === 'callback' || authError === 'account_not_found' ? authError : undefined}
    />
  );
}
