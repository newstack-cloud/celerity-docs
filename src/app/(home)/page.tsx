import Features from '@/components/features';
import Hero from '@/components/hero';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <Hero />
      <Features />
    </main>
  );
}
