// Hosts matching these patterns are "public deployments" — they get the
// marketing landing page and self-serve signup. All other hosts are
// customer-specific deployments where signup is not offered.
export const PUBLIC_TENANT_PATTERNS = ['faktur', 'popdesign', 'localhost']

export function isPublicTenantHost(host: string | null | undefined): boolean {
  if (!host) return false
  return PUBLIC_TENANT_PATTERNS.some((pattern) => host.includes(pattern))
}
