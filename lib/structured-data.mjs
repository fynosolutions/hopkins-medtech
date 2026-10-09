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

const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function jobPostingSchema(job, publication, company, origin, today = new Date()) {
  // A position description alone does not establish that applications are open.
  if (!publication?.confirmed || !publication.datePosted || !publication.source) return null;
  const posted = Date.parse(publication.datePosted);
  if (!Number.isFinite(posted) || posted > today.getTime()) return null;
  const locations = publication.locations || [];
  const remoteCountries = publication.remoteCountries || [];
  if (!locations.length && !remoteCountries.length) return null;
  if (locations.some(address => !address.addressCountry)) return null;
  if (publication.validThrough && (!Number.isFinite(Date.parse(publication.validThrough)) || Date.parse(publication.validThrough) < today.getTime())) return null;
  return {
    '@context': schemaContext,
    '@type': 'JobPosting',
    '@id': new URL(`/careers/${job.slug}#job`, origin).href,
    url: new URL(`/careers/${job.slug}`, origin).href,
    title: job.title,
    identifier: {'@type': 'PropertyValue', name: company.legalName, value: job.id},
    employmentType: 'INTERN',
    hiringOrganization: {'@id': organizationId(origin)},
    datePosted: publication.datePosted,
    ...(publication.validThrough ? {validThrough: publication.validThrough} : {}),
    ...(locations.length ? {jobLocation: locations.map(address => ({'@type': 'Place', address: {'@type': 'PostalAddress', ...address}}))} : {}),
    ...(remoteCountries.length ? {jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: remoteCountries.map(name => ({'@type': 'Country', name}))} : {}),
    description: '<p>Educational partner referral. Candidates apply through their education partner with a CV and short note, followed by a conversation with the project lead.</p>' + job.sections.map(section => `<p>${escapeHtml(section.title)}</p>` + section.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('')).join(''),
  };
}

export function articleSchema(item, origin, originalSourceUrl) {
  const historical = item.type === 'Historical Resources';
  const pageUrl = new URL('/resources/' + item.slug, origin).href;
  const original = {
    '@type': item.type === 'Research Papers' ? 'ScholarlyArticle' : 'Article',
    headline: item.paperTitle || item.title,
    url: originalSourceUrl || item.sourceUrl,
    ...(item.originalPublicationDate ? {datePublished: item.originalPublicationDate} : {}),
    ...(item.author ? {creditText: 'Original source authors: ' + item.author} : {}),
    ...(item.sourceOrganization ? {publisher: {'@type': 'Organization', name: item.sourceOrganization}} : {}),
  };
  return {
    '@context': schemaContext,
    '@type': 'Article',
    '@id': pageUrl + '#article',
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    headline: item.title,
    description: item.excerpt,
    inLanguage: 'en',
    publisher: historical && item.sourceOrganization === 'EMMA International'
      ? {'@type': 'Organization', name: 'EMMA International', url: 'https://emmainternational.com/'}
      : {'@id': organizationId(origin)},
    ...(historical && item.author ? {author: {'@type': item.sourceOrganization === 'EMMA International' ? 'Person' : 'Organization', name: item.author}} : {}),
    ...(historical && item.originalPublicationDate ? {datePublished: item.originalPublicationDate} : {}),
    // The source's authors/date do not establish authorship/publication of our summary.
    ...(historical ? {} : {isBasedOn: original}),
    citation: [original, ...(item.additionalSources || []).map(source => ({'@type': 'CreativeWork', name: source.label, url: source.url}))],
  };
}
