import { getSupabase, SiteService } from '@/lib/db';

export const getExistingValues = async (supabase: ReturnType<typeof getSupabase>) => {
  const siteService = new SiteService(supabase);
  const filterStats = await siteService.getFilterStats();

  return {
    existingIndustries: filterStats.industries.map((i) => i.value),
    existingCategories: filterStats.categories.map((c) => c.value),
    existingCountries: filterStats.countries.map((c) => c.value),
    existingLanguages: filterStats.languages.map((l) => l.value),
    existingCompanySizes: filterStats.companySizes.map((c) => c.value),
  };
};
