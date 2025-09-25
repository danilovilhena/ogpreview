import { LoadingSkeleton } from '@/components/loading-skeleton';
import { SitesGrid } from '@/components/sites-grid';
import { Suspense } from 'react';

interface HomeProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    industry?: string;
    category?: string;
    country?: string;
    language?: string;
    companySize?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1');

  return (
    <div className="w-full min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center gap-4 mt-8 mb-12">
          <h1 className="text-5xl max-w-3xl font-serif text-neutral-900 text-balance">
            The Ultimate <span className="text-sky-600 italic">Open Graph</span> Image Gallery
          </h1>
          <p className="text-neutral-500">Browse a curated gallery of OG images from top websites and discover what makes them stand out.</p>
        </div>
        <Suspense fallback={<LoadingSkeleton />}>
          <SitesGrid page={page} searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
