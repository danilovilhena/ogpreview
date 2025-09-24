import { LoadingSkeleton } from '@/components/loading-skeleton';
import { SitesGrid } from '@/components/sites-grid';
import { Suspense } from 'react';

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');

  return (
    <div className="w-full py-8 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <SitesGrid page={page} />
        </Suspense>
      </div>
    </div>
  );
}
