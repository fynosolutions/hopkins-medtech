// Archive pages are served with noindex, so they stay out of the sitemap.
export function sitemapEntries(routes, origin, updates) {
  return [...new Set(routes)].filter(route => route !== '/search' && route !== '/archive' && !route.startsWith('/archive/')).map(route => {
    const dates = [updates.sharedStructuredDataUpdated, updates.pages[route]].filter(Boolean).sort();
    return {url: new URL(route, origin).href, ...(dates.length ? {lastModified: dates[dates.length - 1]} : {})};
  });
}
