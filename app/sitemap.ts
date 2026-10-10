import type {MetadataRoute} from 'next';
import {allRoutes} from '@/lib/content';
import {siteOrigin} from '@/lib/site-url';
import {sitemapEntries} from '@/lib/sitemap.mjs';
import updates from '@/content/page-updates.json';

export default function sitemap():MetadataRoute.Sitemap {
  return sitemapEntries(allRoutes(), siteOrigin(), updates);
}
