import { SiteCard } from '@/components/site-card';
import { Pagination } from '@/components/pagination';
import type { ApiResponse } from '@/types/api';

interface SearchParams {
  search?: string;
  industry?: string;
  category?: string;
  country?: string;
  language?: string;
  companySize?: string;
}

async function fetchSites(page: number = 1, limit: number = 60, searchParams?: SearchParams): Promise<ApiResponse> {
  const offset = (page - 1) * limit;
  const baseUrl =
    process.env.NODE_ENV === 'production' ? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://ogpreview.co') : 'http://localhost:3000';

  // Build query parameters
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  // Add search and filter parameters if provided
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
  }

  const url = `${baseUrl}/api/sites?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sites: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching sites:', error);
    return {
      success: false,
      data: [],
      pagination: { total: 0, limit, offset, hasMore: false },
    };
  }
}

interface SitesGridProps {
  page: number;
  searchParams?: SearchParams;
}

export async function SitesGrid({ page, searchParams }: SitesGridProps) {
  const sitesData = await fetchSites(page, 60, searchParams);

  if (!sitesData.success || sitesData.data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No sites found.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(sitesData.pagination.total / sitesData.pagination.limit);

  return (
    <div className="w-full max-w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {sitesData.data.map((siteData) => (
          <SiteCard key={siteData.site.id} siteData={siteData} />
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} hasMore={sitesData.pagination.hasMore} />
    </div>
  );
}
