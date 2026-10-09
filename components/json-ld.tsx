import {serializeJsonLd} from '@/lib/structured-data.mjs';

export function JsonLd({data, id}: {data: object; id: string}) {
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{__html: serializeJsonLd(data)}}/>;
}
