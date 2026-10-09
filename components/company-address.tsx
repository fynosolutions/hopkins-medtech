import company from '@/content/company.json';

export function CompanyAddress() {
  const address = company.postalAddress;
  return <>{address.streetAddress}<br/>{address.addressLocality}, {address.addressRegion} {address.postalCode}<br/>United States</>;
}
