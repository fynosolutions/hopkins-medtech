import './evidence.css';
import {JsonLd} from '@/components/json-ld';
import {organizationSchema} from '@/lib/structured-data.mjs';
import {company} from '@/lib/content';
import {siteOrigin} from '@/lib/site-url';
import type {Metadata} from 'next';
import {Header} from '@/components/header';
import {Footer} from '@/components/footer';
import {MotionProvider} from '@/components/motion';
import './globals.css';
import './motion.css';
import './legacy.css';
import './team.css';
const origin=process.env.SITE_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?'https://'+process.env.VERCEL_PROJECT_PRODUCTION_URL:'http://localhost:3000');
export const metadata:Metadata={metadataBase:new URL(origin),title:{default:'Hopkins MedTech Compliance | Clinical Insight. Regulatory Clarity.',template:'%s | Hopkins MedTech'},description:'CRO and regulatory consulting for medical devices and in vitro diagnostics. Clinical evidence, FDA submissions, IVDR compliance and market entry support.',robots:process.env.SITE_INDEXABLE==='true'?{index:true,follow:true}:{index:false,follow:false},icons:{icon:'/icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><JsonLd id="organization-jsonld" data={organizationSchema(company,siteOrigin())}/><MotionProvider><Header/><main id="main" tabIndex={-1}>{children}</main><Footer/></MotionProvider></body></html>}
