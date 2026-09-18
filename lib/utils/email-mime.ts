// Shared MIME helpers for outbound SES email. Every message gets a
// text/plain alternative alongside the HTML — HTML-only email is a strong
// spam signal for Gmail/Outlook.

export function htmlToPlainText(html: string): string {
  let text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Preserve link destinations: <a href="url">label</a> -> label (url)
  text = text.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, label) => {
    const cleanLabel = label.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!cleanLabel || cleanLabel === href) return href;
    return `${cleanLabel} (${href})`;
  });

  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li|table|ul|ol)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '  ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");

  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface RawEmailAttachment {
  filename: string;
  contentBase64: string;
  contentType?: string;
}

export function buildRawEmail(options: {
  from: string;
  to: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachment?: RawEmailAttachment;
}): string {
  const { from, to, subject, htmlBody, attachment } = options;
  const textBody = options.textBody ?? htmlToPlainText(htmlBody);

  const mixedBoundary = `----=_Mixed_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const altBoundary = `----=_Alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const lines = [
    `From: ${from}`,
    `To: ${to.join(', ')}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    '',
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    textBody,
    '',
    `--${altBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    '',
    `--${altBoundary}--`,
  ];

  if (attachment) {
    const contentType = attachment.contentType || 'application/pdf';
    lines.push(
      '',
      `--${mixedBoundary}`,
      `Content-Type: ${contentType}; name="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      attachment.contentBase64,
    );
  }

  lines.push('', `--${mixedBoundary}--`);

  return lines.join('\r\n');
}
