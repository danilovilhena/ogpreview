export interface ScrapedMetadata {
  basic: BasicMetadata;
  openGraph: OpenGraphMetadata;
  twitter: TwitterMetadata;
  jsonLd?: Record<string, unknown>[];
  raw: MetaTag[];
}

export interface RawMetadata {
  raw: MetaTag[];
}

export interface MetaTag {
  name?: string;
  property?: string;
  content?: string;
  charset?: string;
  httpEquiv?: string;
}

export interface BasicMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  robots?: {
    all?: string;
    googlebot?: string;
    bingbot?: string;
  };
  viewport?: string;
  charset?: string;
  generator?: string;
  publisher?: string;
  themeColor?: string;
  favicon?: string;
  canonical?: string;
}

export interface OpenGraphMetadata {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  localeAlternate?: string[];
  images?: string[];
  imageSecureUrl?: string[];
  imageType?: string[];
  imageWidth?: string;
  imageHeight?: string;
  imageAlt?: string;
  audio?: string;
  video?: string;
  determiner?: string;
  updatedTime?: string;
  seeAlso?: string[];
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  articleTag?: string[];
}

export interface TwitterMetadata {
  card?: string;
  site?: string;
  siteId?: string;
  creator?: string;
  creatorId?: string;
  title?: string;
  description?: string;
  images?: string[];
  imageAlt?: string;
  appNameIphone?: string;
  appIdIphone?: string;
  appNameIpad?: string;
  appIdIpad?: string;
  appNameGoogleplay?: string;
  appIdGoogleplay?: string;
}

export interface JsonLdMetadata {
  jsonLd?: Record<string, unknown>[];
}
