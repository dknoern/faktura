export function formatFromAddress(displayName: string | undefined | null, email: string): string {
  const name = (displayName || "").trim();
  if (!name) return email;
  const needsQuoting = /[",;<>()@\[\]\\]/.test(name);
  const escaped = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const formatted = needsQuoting ? `"${escaped}"` : name;
  return `${formatted} <${email}>`;
}
