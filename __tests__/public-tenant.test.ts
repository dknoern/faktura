import { normalizeHostname, hostMatchesDomain, isValidDomain } from '@/lib/public-tenant';

describe('normalizeHostname', () => {
  it('lowercases and strips protocol, www, port, and paths', () => {
    expect(normalizeHostname('HTTPS://WWW.DemesyInventory.com:3000/foo')).toBe('demesyinventory.com');
    expect(normalizeHostname('www.mystore.com')).toBe('mystore.com');
    expect(normalizeHostname('localhost:3000')).toBe('localhost');
    expect(normalizeHostname(null)).toBe('');
  });

  it('takes the first hop from a comma-separated forwarded host', () => {
    expect(normalizeHostname('test.demesyinventory.com, edge.internal')).toBe('test.demesyinventory.com');
    expect(normalizeHostname('test.demesyinventory.com,edge.internal')).toBe('test.demesyinventory.com');
  });
});

describe('hostMatchesDomain', () => {
  it('matches the apex domain', () => {
    expect(hostMatchesDomain('demesyinventory.com', 'demesyinventory.com')).toBe(true);
  });

  it('matches www and other subdomains', () => {
    expect(hostMatchesDomain('www.demesyinventory.com', 'demesyinventory.com')).toBe(true);
    expect(hostMatchesDomain('shop.demesyinventory.com', 'demesyinventory.com')).toBe(true);
  });

  it('matches deeply nested subdomains', () => {
    expect(hostMatchesDomain('test.demesyinventory.com', 'demesyinventory.com')).toBe(true);
    expect(hostMatchesDomain('deep.staging.demesyinventory.com', 'demesyinventory.com')).toBe(true);
  });

  it('matches a subdomain even when a proxy appends extra hops', () => {
    expect(hostMatchesDomain('test.demesyinventory.com, edge.internal', 'demesyinventory.com')).toBe(true);
  });

  it('matches when the request host includes a port', () => {
    expect(hostMatchesDomain('demesyinventory.com:443', 'demesyinventory.com')).toBe(true);
  });

  it('does not match unrelated or suffix-similar domains', () => {
    expect(hostMatchesDomain('fakturian.com', 'demesyinventory.com')).toBe(false);
    expect(hostMatchesDomain('evildemesyinventory.com', 'demesyinventory.com')).toBe(false);
    expect(hostMatchesDomain('demesyinventory.com.evil.com', 'demesyinventory.com')).toBe(false);
  });

  it('tolerates a stored domain entered with www or protocol', () => {
    expect(hostMatchesDomain('demesyinventory.com', 'https://www.demesyinventory.com')).toBe(true);
  });

  it('never matches an empty domain', () => {
    expect(hostMatchesDomain('demesyinventory.com', '')).toBe(false);
    expect(hostMatchesDomain('demesyinventory.com', undefined)).toBe(false);
  });
});

describe('isValidDomain', () => {
  it('accepts normal domains', () => {
    expect(isValidDomain('mystore.com')).toBe(true);
    expect(isValidDomain('shop.my-store.co.uk')).toBe(true);
  });

  it('rejects bare hosts, protocols, and junk', () => {
    expect(isValidDomain('localhost')).toBe(false);
    expect(isValidDomain('http://mystore.com')).toBe(false);
    expect(isValidDomain('my store.com')).toBe(false);
    expect(isValidDomain('')).toBe(false);
  });
});
