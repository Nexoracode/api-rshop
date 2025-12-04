import { SetMetadata } from '@nestjs/common';

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export const SEO_METADATA_KEY = 'seo_metadata';
export const SeoMeta = (metadata: SeoMetadata) => SetMetadata(SEO_METADATA_KEY, metadata);
