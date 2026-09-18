import { htmlToPlainText, buildRawEmail } from '@/lib/utils/email-mime';

describe('htmlToPlainText', () => {
  it('converts paragraphs and line breaks to newlines', () => {
    const text = htmlToPlainText('<p>Hello:</p><p>Your invoice is attached.</p><p>Thank you.</p>');
    expect(text).toBe('Hello:\nYour invoice is attached.\nThank you.');
  });

  it('preserves link destinations with their labels', () => {
    const text = htmlToPlainText('<p>Use this <a href="https://pay.example.com/x">payment link</a>.</p>');
    expect(text).toContain('payment link (https://pay.example.com/x)');
  });

  it('does not duplicate the URL when the label is the URL itself', () => {
    const text = htmlToPlainText('<a href="https://example.com/a">https://example.com/a</a>');
    expect(text).toBe('https://example.com/a');
  });

  it('strips style blocks and tags, and decodes entities', () => {
    const text = htmlToPlainText(`
      <html><head><style>body { color: red; }</style></head>
      <body><div>Smith &amp; Sons &#39;est. 1990&#39;</div></body></html>
    `);
    expect(text).toBe("Smith & Sons 'est. 1990'");
    expect(text).not.toContain('color');
  });

  it('collapses excess blank lines', () => {
    const text = htmlToPlainText('<p>a</p><br><br><br><p>b</p>');
    expect(text).not.toMatch(/\n{3,}/);
  });
});

describe('buildRawEmail', () => {
  const base = {
    from: 'Acme <acme@example.com>',
    to: ['customer@example.com'],
    subject: 'Invoice #1',
    htmlBody: '<p>Hello</p><p>Your invoice is attached.</p>',
  };

  it('produces a multipart/alternative body with text before html', () => {
    const raw = buildRawEmail(base);
    expect(raw).toContain('Content-Type: multipart/mixed');
    expect(raw).toContain('Content-Type: multipart/alternative');
    const textIndex = raw.indexOf('Content-Type: text/plain');
    const htmlIndex = raw.indexOf('Content-Type: text/html');
    expect(textIndex).toBeGreaterThan(-1);
    expect(htmlIndex).toBeGreaterThan(textIndex);
    expect(raw).toContain('Hello\nYour invoice is attached.');
  });

  it('includes the attachment part when provided', () => {
    const raw = buildRawEmail({
      ...base,
      attachment: { filename: 'Invoice-1.pdf', contentBase64: 'QUJD' },
    });
    expect(raw).toContain('Content-Type: application/pdf; name="Invoice-1.pdf"');
    expect(raw).toContain('Content-Disposition: attachment; filename="Invoice-1.pdf"');
    expect(raw).toContain('QUJD');
  });

  it('uses an explicit textBody when given', () => {
    const raw = buildRawEmail({ ...base, textBody: 'CUSTOM TEXT' });
    expect(raw).toContain('CUSTOM TEXT');
  });
});
