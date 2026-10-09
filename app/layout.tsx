import company from '@/content/company.json';
import {JsonLd} from '@/components/json-ld';
import {organizationSchema} from '@/lib/structured-data.mjs';
import {siteOrigin} from '@/lib/site-url';
import type {Metadata} from 'next';
import {Header} from '@/components/header';
import {Footer} from '@/components/footer';
import {MotionProvider} from '@/components/motion';
import './globals.css';
import './motion.css';
import './legacy.css';
import './team.css';
import './evidence.css';
const origin=siteOrigin();
export const metadata:Metadata={metadataBase:new URL(origin),title:{default:'Hopkins MedTech Compliance | Clinical Research and Regulatory Support',template:'%s | Hopkins MedTech'},description:'CRO and regulatory consulting for medical devices and in vitro diagnostics. Clinical evidence, FDA submissions, IVDR compliance and market entry support.',robots:process.env.SITE_INDEXABLE==='true'?{index:true,follow:true}:{index:false,follow:false},icons:{icon:'/icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><JsonLd id="organization-jsonld" data={organizationSchema(company, origin)}/><MotionProvider><Header/><main id="main" tabIndex={-1}>{children}</main><Footer/></MotionProvider></body></html>}
