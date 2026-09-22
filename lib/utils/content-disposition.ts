// HTTP header values must be Latin-1 (ByteString). User-supplied filenames can
// contain characters like U+202F (macOS puts a narrow no-break space before
// "PM" in screenshot names), which crash header serialization. Send an
// ASCII-safe fallback plus the RFC 5987 UTF-8 encoded form.
export function contentDispositionHeader(
  disposition: 'inline' | 'attachment',
  filename: string
): string {
  const fallback = filename
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(filename)
    .replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
