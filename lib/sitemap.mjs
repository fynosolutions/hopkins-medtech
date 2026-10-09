export function sitemapEntries(routes, origin, updates) {
  return [...new Set(routes)].filter(route => route !== '/search' && route !== '/about/team/jeff-wu').map(route => {
    const dates = [updates.sharedStructuredDataUpdated, updates.pages[route]].filter(Boolean).sort();
    return {url: new URL(route, origin).href, ...(dates.length ? {lastModified: dates[dates.length - 1]} : {})};
  });
}
