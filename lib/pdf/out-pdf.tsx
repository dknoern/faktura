import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Svg, Path, Circle, Line } from '@react-pdf/renderer';
import { Out, Tenant } from '@/lib/out-renderer';

const gold = '#B69D57';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#333',
    padding: 40,
    lineHeight: 1.5,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logo: {
    width: 150,
    height: 60,
  },
  outLabel: {
    color: gold,
    fontSize: 20,
    marginTop: 6,
  },
  headerRight: {
    textAlign: 'left',
  },
  headerLine: {
    marginBottom: 1,
  },
  // Details
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 9,
    marginBottom: 10,
  },
  // Signature
  signatureSection: {
    marginTop: 12,
    marginBottom: 12,
  },
  signatureBox: {
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  signatureImage: {
    height: 50,
    objectFit: 'contain' as any,
  },
  signatureDate: {
    fontSize: 8,
    color: '#666',
    marginTop: 4,
  },
  // Comments
  commentsText: {
    fontSize: 9,
    marginBottom: 12,
  },
  // Images
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  imageBox: {
    width: '30%',
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#f9f9f9',
  },
  outImage: {
    width: '100%',
    height: 120,
    objectFit: 'contain' as any,
    borderRadius: 4,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    fontSize: 8,
  },
  footerCol: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  footerIcon: {
    marginRight: 6,
    marginTop: 1,
  },
  footerColText: {
    flex: 1,
  },
  footerLabel: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
    fontSize: 8,
  },
  footerText: {
    fontSize: 8,
  },
});

const formatDate = (date: Date | string): string => {
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + dateObj.toLocaleTimeString('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

interface OutPdfProps {
  out: Out;
  tenant: Tenant;
  logoUrl: string;
  imageUrls?: string[];
}

export function OutPdfDocument({ out, tenant, logoUrl, imageUrls = [] }: OutPdfProps) {
  const formattedDate = formatDate(out.date);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={{ transform: 'scale(0.9)', transformOrigin: 'top left', width: '111%' }}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Image src={logoUrl} style={styles.logo} />
              <Text style={styles.outLabel}>LOG OUT ENTRY</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerLine}>{tenant.address || ''}</Text>
              <Text style={styles.headerLine}>{tenant.city || ''}, {tenant.state || ''} {tenant.zip || ''}</Text>
              <Text style={styles.headerLine}>Phone {tenant.phone || ''}</Text>
              {tenant.fax ? <Text style={styles.headerLine}>Fax {tenant.fax}</Text> : null}
            </View>
          </View>

          {/* Log Out Entry Details */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Log Out Entry Details</Text>

            <Text style={styles.fieldLabel}>Date & Time</Text>
            <Text style={styles.fieldValue}>{formattedDate}</Text>

            <Text style={styles.fieldLabel}>Sent To</Text>
            <Text style={styles.fieldValue}>{out.sentTo || 'Not specified'}</Text>

            <Text style={styles.fieldLabel}>Description</Text>
            <Text style={styles.fieldValue}>{out.description || 'Not specified'}</Text>

            {out.user ? (
              <>
                <Text style={styles.fieldLabel}>Logged By</Text>
                <Text style={styles.fieldValue}>{out.user}</Text>
              </>
            ) : null}
          </View>

          {/* Comments */}
          {out.comments ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Comments</Text>
              <Text style={styles.commentsText}>{out.comments}</Text>
            </View>
          ) : null}

          {/* Signature */}
          {out.signature ? (
            <View style={styles.signatureSection}>
              <Text style={styles.sectionTitle}>Signature</Text>
              <View style={styles.signatureBox}>
                <Image src={out.signature} style={styles.signatureImage} />
                {out.signatureDate ? (
                  <Text style={styles.signatureDate}>
                    Signed on {new Date(out.signatureDate).toLocaleDateString('en-US', {
                      timeZone: process.env.TIMEZONE || 'America/Chicago',
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Images */}
          {imageUrls && imageUrls.length > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Images</Text>
              <View style={styles.imagesGrid}>
                {imageUrls.map((url, idx) => (
                  <View key={idx} style={styles.imageBox}>
                    <Image src={url} style={styles.outImage} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerCol}>
              <View style={styles.footerIcon}>
                <Svg width="14" height="14" viewBox="0 0 24 24">
                  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={gold} strokeWidth="2" fill="none" />
                </Svg>
              </View>
              <View style={styles.footerColText}>
                <Text style={styles.footerLabel}>PHONE</Text>
                <Text style={styles.footerText}>{tenant.phone || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.footerCol}>
              <View style={styles.footerIcon}>
                <Svg width="14" height="14" viewBox="0 0 24 24">
                  <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke={gold} strokeWidth="2" fill="none" />
                  <Circle cx="12" cy="10" r="3" stroke={gold} strokeWidth="2" fill="none" />
                </Svg>
              </View>
              <View style={styles.footerColText}>
                <Text style={styles.footerLabel}>ADDRESS</Text>
                <Text style={styles.footerText}>{tenant.address || ''}</Text>
                <Text style={styles.footerText}>{tenant.city || ''}, {tenant.state || ''} {tenant.zip || ''}</Text>
              </View>
            </View>
            <View style={styles.footerCol}>
              <View style={styles.footerIcon}>
                <Svg width="14" height="14" viewBox="0 0 24 24">
                  <Circle cx="12" cy="12" r="10" stroke={gold} strokeWidth="2" fill="none" />
                  <Line x1="2" y1="12" x2="22" y2="12" stroke={gold} strokeWidth="2" />
                  <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={gold} strokeWidth="2" fill="none" />
                </Svg>
              </View>
              <View style={styles.footerColText}>
                <Text style={styles.footerLabel}>EMAIL</Text>
                <Text style={styles.footerText}>{tenant.email || 'N/A'}</Text>
              </View>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
}
