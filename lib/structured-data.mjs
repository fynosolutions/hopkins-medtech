export const schemaContext = 'https://schema.org';

export function organizationId(origin) {
  return new URL('/#organization', origin).href;
}

export function organizationSchema(company, origin) {
  return {
    '@context': schemaContext,
    '@type': 'Organization',
    '@id': organizationId(origin),
    name: company.name,
    legalName: company.legalName,
    alternateName: company.alternateName,
    url: new URL('/', origin).href,
    logo: new URL(company.logo, origin).href,
    telephone: company.phone,
    email: company.email,
    address: {'@type': 'PostalAddress', ...company.postalAddress},
    sameAs: [company.linkedin],
  };
}

// JSON-LD is emitted in HTML, so a literal closing script must never survive.
export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
