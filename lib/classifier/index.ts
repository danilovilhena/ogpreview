import { CATEGORIES, COMPANY_SIZES, INDUSTRIES, type Domain, type Site, type SiteMetadata } from '@/lib/db/types';
import { generateSlug, safeJsonParse } from '@/lib/utils';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getExistingValues } from './getExistingValues';

const MODEL = 'google/gemini-2.5-flash-preview-09-2025';

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! });

const classificationSchema = z.object({
  title: z.string().optional(),
  industry: z.enum([...INDUSTRIES] as [string, ...string[]]).optional(),
  category: z.enum([...CATEGORIES] as [string, ...string[]]).optional(),
  country: z.string().max(100).optional(), // ISO country codes
  language: z.string().max(10).optional(), // en, es, fr, etc.
  company_size: z.enum([...COMPANY_SIZES] as [string, ...string[]]).optional(),
  is_featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  affiliate_link: z.string().url().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

type SiteWithDomain = Site & { domain: Domain };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shouldRetry = (error: Error, result?: any): boolean => {
  const errorMessage = error.message;

  if (errorMessage.includes('No object generated: response did not match schema')) {
    return true;
  }

  if (result?.title && result.title.length > 100) {
    return true;
  }

  return false;
};

export const classifySite = async (
  siteData: SiteWithDomain,
  metadataData: SiteMetadata | null,
  existingValues: Awaited<ReturnType<typeof getExistingValues>>,
) => {
  // Parse metadata for additional information
  const basicMeta = safeJsonParse(metadataData?.basic_metadata);
  const ogMeta = safeJsonParse(metadataData?.open_graph_metadata);
  const twitterMeta = safeJsonParse(metadataData?.twitter_metadata);
  const jsonLdMeta = safeJsonParse(metadataData?.ld_json_metadata);

  const prompt = `You are an AI assistant that classifies websites based on their metadata and your knowledge of companies/products.

WEBSITE DATA:
URL: ${siteData.url}
Domain: ${siteData.domain?.domain || 'N/A'}

METADATA INFORMATION:
Basic Title: ${metadataData?.title || basicMeta?.title || 'N/A'}
Basic Description: ${metadataData?.description || basicMeta?.description || 'N/A'}

Open Graph Data:
- Title: ${ogMeta?.title || 'N/A'}
- Description: ${ogMeta?.description || 'N/A'}
- Site Name: ${ogMeta?.site_name || ogMeta?.siteName || 'N/A'}
- Type: ${ogMeta?.type || 'N/A'}
- Locale: ${ogMeta?.locale || 'N/A'}
- Image: ${ogMeta?.image || 'N/A'}

Twitter Card Data:
- Title: ${twitterMeta?.title || 'N/A'}
- Description: ${twitterMeta?.description || 'N/A'}
- Card Type: ${twitterMeta?.card || 'N/A'}
- Site: ${twitterMeta?.site || 'N/A'}
- Creator: ${twitterMeta?.creator || 'N/A'}

JSON-LD/Schema.org Data:
${jsonLdMeta && Object.keys(jsonLdMeta).length > 0 ? JSON.stringify(jsonLdMeta, null, 2) : 'N/A'}

Additional Meta Tags:
- Keywords: ${basicMeta?.keywords || 'N/A'}
- Author: ${basicMeta?.author || 'N/A'}
- Application Name: ${basicMeta?.applicationName || basicMeta?.['application-name'] || 'N/A'}
- Theme Color: ${basicMeta?.themeColor || basicMeta?.['theme-color'] || 'N/A'}

EXISTING CLASSIFICATION VALUES (prefer these for consistency):
Industries: ${existingValues.existingIndustries.join(', ')}
Categories: ${existingValues.existingCategories.join(', ')}
Countries: ${existingValues.existingCountries.join(', ')}
Languages: ${existingValues.existingLanguages.join(', ')}
Company Sizes: ${existingValues.existingCompanySizes.join(', ')}

CURRENT VALUES (reuse if still accurate):
Industry: ${siteData.industry || 'not set'}
Category: ${siteData.category || 'not set'}
Country: ${siteData.country || 'not set'}
Language: ${siteData.language || 'not set'}
Company Size: ${siteData.company_size || 'not set'}

INSTRUCTIONS:
Use your knowledge about this company/product along with the metadata to classify accurately:

1. Extract a clean, short title (remove taglines, company suffixes, keep under 100 characters)
2. Use your knowledge of this company/product to determine:
   - Industry and category (prefer existing values when appropriate)
   - For categories, use the most specific SaaS category that fits the product/service from the available options
   - Country of origin for the software/company (use ISO codes like US, UK, DE, FR)
   - Company size based on what you know about the organization
   - Whether this is a well-known, high-quality site (is_featured)
3. Identify primary language from metadata or your knowledge (codes like en, es, fr, de)
4. Add relevant tags (3-5 descriptive keywords) based on the product/service
5. Only provide affiliate_link if you can clearly identify one from the metadata
6. Set confidence between 0-1 based on how certain you are

CATEGORY GUIDELINES:
- All sites are SaaS products, so choose the most specific category that matches the product's core functionality
- Prefer specific categories over general ones (e.g., "CRM & Sales" over "Business Software")
- If a product fits multiple categories, choose the primary/core function
- Use "Miscellaneous" only when no other category fits

Research the company/product in your knowledge base. If you recognize the site/company, use that information to provide accurate classification. Otherwise, work with the metadata available.

ONLY answer if you're confident. Leave fields blank/undefined if uncertain.
Prefer reusing existing classification values to maintain consistency.`;

  const maxRetries = 5;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateObject({ model: openrouter(MODEL), schema: classificationSchema, prompt });
      const classification = result.object;

      if (classification.title && classification.title.length > 100) {
        const titleError = new Error(`Title too long: ${classification.title.length} characters`);
        if (attempt < maxRetries && shouldRetry(titleError, classification)) {
          console.warn(`Attempt ${attempt}/${maxRetries}: Title too long (${classification.title.length} chars), retrying...`);
          lastError = titleError;

          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw titleError;
      }

      const finalClassification = {
        ...classification,
        ...(classification.title && { slug: generateSlug(classification.title) }),
      };

      return finalClassification;
    } catch (error) {
      const currentError = error instanceof Error ? error : new Error('Unknown error');
      lastError = currentError;

      if (attempt < maxRetries && shouldRetry(currentError)) {
        console.warn(`Attempt ${attempt}/${maxRetries}: ${currentError.message}, retrying...`);

        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      break;
    }
  }

  console.error(`AI classification failed after ${maxRetries} attempts!`);
  throw new Error(`AI classification failed: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
};
