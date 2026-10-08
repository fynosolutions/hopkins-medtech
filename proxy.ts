import {NextRequest,NextResponse} from 'next/server';
import map from './redirect-map.json';
import {legacyDestination} from './lib/legacy.mjs';
export function proxy(request:NextRequest){const to=legacyDestination(request.url,map);if(to)return NextResponse.redirect(new URL(to,request.url),308);return NextResponse.next()}
export const config={matcher:['/((?!_next/static|_next/image|media|downloads|api|icon.svg|favicon.ico).*)']};
