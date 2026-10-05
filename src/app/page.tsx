import { type Metadata } from 'next';
import { Landing } from '~/views/Landing';
export const metadata: Metadata = {
  title: 'Атлас — виртуальные карты для оплаты сервисов',
  description:
    'Виртуальные долларовые карты Атласа: варианты карт, управление балансом и онлайн-оплата. Сервис готовится к запуску.',
};
export default function Page() {
  return <Landing />;
}
