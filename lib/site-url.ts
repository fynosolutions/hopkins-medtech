export function siteOrigin() {
  return (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL
    : 'http://localhost:3000')).replace(/\/$/, '');
}
