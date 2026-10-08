import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{const root=process.env.SITE_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL:'http://localhost:3000');return {rules:{userAgent:'*',...(process.env.SITE_INDEXABLE==='true'?{allow:'/',disallow:'/api/'}:{disallow:'/'})},sitemap:root+'/sitemap.xml'}}
