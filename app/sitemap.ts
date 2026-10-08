import type {MetadataRoute} from 'next';
import {allRoutes} from '@/lib/content';
export default function sitemap():MetadataRoute.Sitemap{const root=process.env.SITE_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL:'http://localhost:3000');return allRoutes().filter(x=>x!=='/search').map(x=>({url:root+x}))}
