import archive from '@/content/archive.json';
// The old site's test entries (a "12313" record and two placeholder images) stay in the data file but are not published.
const unpublished = (category?: string) => category === 'Test record' || category === 'Test and placeholder images';
export const archiveRecords = archive.records.filter(x => !unpublished(x.category));
export const archiveImages = archive.images.filter(x => !unpublished(x.category));
export const originalNavigation = archive.navigation;
export function archiveRoutes(){return ['/archive','/archive/media',...archiveRecords.map(x=>x.route)]}
export function originalSearchRecords(){return archiveRecords.map(x=>({title:x.title,href:x.route,type:'Original website record',text:x.html.replace(/<[^>]*>/g,' ')+' '+x.additionalText.join(' '),excerpt:x.excerpt}))}
