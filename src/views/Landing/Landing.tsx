'use client';
import { PublicLayout } from '~/widgets/PublicLayout';
import { Hero, Tariffs, HowItWorks, Principles, Faq } from './components';
export function Landing() {
  return (
    <PublicLayout>
      <Hero />
      <Tariffs />
      <HowItWorks />
      <Principles />
      <Faq />
    </PublicLayout>
  );
}
