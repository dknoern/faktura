// Helpers for matching request hostnames against tenant custom domains.
// A tenant with a customDomain gets a branded landing page with no
// self-signup; all other hosts get the generic Fakturian landing with signup.

// Normalizes user/browser-supplied host values to a bare lowercase hostname
export function normalizeHostname(value: string | null | undefined): string {
  if (!value) return ''
  return value
    // Forwarded headers accumulate one value per proxy hop
    // ("test.example.com, edge.internal"). The first is the host the client
    // actually asked for; without this a second hop breaks domain matching.
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
    .replace(/\.$/, '')
}

// True when the request host is the domain itself or any subdomain of it
// (e.g. demesyinventory.com, www.demesyinventory.com, shop.demesyinventory.com)
export function hostMatchesDomain(host: string | null | undefined, domain: string | null | undefined): boolean {
  const h = normalizeHostname(host)
  const d = normalizeHostname(domain)
  if (!h || !d) return false
  return h === d || h.endsWith(`.${d}`)
}

export function isValidDomain(value: string): boolean {
  return /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(value)
}
