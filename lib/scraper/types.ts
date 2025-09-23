export interface ScrapedMetadata {
  basic: BasicMetadata;
  openGraph: OpenGraphMetadata;
  twitter: TwitterMetadata;
  structured: StructuredMetadata;
  images: ImageSource[];
  links: LinkMetadata;
  other: OtherMetadata;
  raw: RawMetadata;
}

export interface ImageSource {
  url: string;
  source: 'og:image' | 'twitter:image' | 'favicon' | 'apple-touch-icon' | 'shortcut-icon' | 'icon' | 'mask-icon' | 'favicon-default';
  sizes?: string;
  type?: string;
}

export interface RawMetadata {
  meta: MetaTag[];
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
  robots?: string;
  robots_googlebot?: string;
  robots_bingbot?: string;
  viewport?: string;
  charset?: string;
  generator?: string;
  publisher?: string;
  theme_color?: string;
  favicon?: string;
}

export interface OpenGraphMetadata {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
  site_name?: string;
  locale?: string;
  locale_alternate?: string[];
  images?: string[];
  image_secure_url?: string[];
  image_type?: string[];
  image_width?: string;
  image_height?: string;
  image_alt?: string;
  audio?: string;
  video?: string;
  determiner?: string;
  updated_time?: string;
  see_also?: string[];
  article_author?: string;
  article_published_time?: string;
  article_modified_time?: string;
  article_section?: string;
  article_tag?: string[];
}

export interface TwitterMetadata {
  card?: string;
  site?: string;
  site_id?: string;
  creator?: string;
  creator_id?: string;
  title?: string;
  description?: string;
  images?: string[];
  image_alt?: string;
  app_name_iphone?: string;
  app_id_iphone?: string;
  app_name_ipad?: string;
  app_id_ipad?: string;
  app_name_googleplay?: string;
  app_id_googleplay?: string;
}

export interface StructuredMetadata {
  jsonLd?: Record<string, unknown>[];
}

export interface LinkMetadata {
  canonical?: string;
}

export interface OtherMetadata {
  msapplication_tilecolor?: string;
  msapplication_tileimage?: string;
  language?: string;
  application_name?: string;
  apple_mobile_web_app_title?: string;
  apple_mobile_web_app_capable?: string;
  apple_mobile_web_app_status_bar_style?: string;
  format_detection?: string;
  mobile_web_app_capable?: string;
}
