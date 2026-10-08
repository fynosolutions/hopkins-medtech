import archive from '@/content/archive.json';
export const archiveRecords = archive.records;
export const archiveImages = archive.images;
export const originalNavigation = archive.navigation;
export function archiveRoutes(){return ['/archive','/archive/media',...archiveRecords.map(x=>x.route)]}
export function originalSearchRecords(){return archiveRecords.map(x=>({title:x.title,href:x.route,type:'Original website record',text:x.html.replace(/<[^>]*>/g,' ')+' '+x.additionalText.join(' '),excerpt:x.excerpt}))}
