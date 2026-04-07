import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Svg, Path, Circle, Line } from '@react-pdf/renderer';
import { Log, Tenant } from '@/lib/log-renderer';

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
  logLabel: {
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
  // Table
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
    paddingBottom: 6,
    marginBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    padding: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
  },
  tableCell: {
    fontSize: 9,
    padding: 6,
  },
  tableCellRight: {
    fontSize: 9,
    padding: 6,
    textAlign: 'right',
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
  logImage: {
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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

interface LogPdfProps {
  log: Log;
  tenant: Tenant;
  logoUrl: string;
  imageUrls?: string[];
}

export function LogPdfDocument({ log, tenant, logoUrl, imageUrls = [] }: LogPdfProps) {
  const formattedDate = formatDate(log.date);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={{ transform: 'scale(0.9)', transformOrigin: 'top left', width: '111%' }}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Image src={logoUrl} style={styles.logo} />
              <Text style={styles.logLabel}>LOG ENTRY</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerLine}>{tenant.address || ''}</Text>
              <Text style={styles.headerLine}>{tenant.city || ''}, {tenant.state || ''} {tenant.zip || ''}</Text>
              <Text style={styles.headerLine}>Phone {tenant.phone || ''}</Text>
              {tenant.fax ? <Text style={styles.headerLine}>Fax {tenant.fax}</Text> : null}
            </View>
          </View>

          {/* Log Entry Details */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Log Entry Details</Text>

            <Text style={styles.fieldLabel}>Date & Time</Text>
            <Text style={styles.fieldValue}>{formattedDate}</Text>

            <Text style={styles.fieldLabel}>Received From</Text>
            <Text style={styles.fieldValue}>{log.receivedFrom || 'Not specified'}</Text>

            <Text style={styles.fieldLabel}>Received By</Text>
            <Text style={styles.fieldValue}>{log.user || 'Not specified'}</Text>

            <Text style={styles.fieldLabel}>Customer Name</Text>
            <Text style={styles.fieldValue}>{log.customerName || 'Not specified'}</Text>

            <Text style={styles.fieldLabel}>Vendor</Text>
            <Text style={styles.fieldValue}>{log.vendor || 'Not specified'}</Text>
          </View>

          {/* Comments */}
          {log.comments ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Comments</Text>
              <Text style={styles.commentsText}>{log.comments}</Text>
            </View>
          ) : null}

          {/* Signature */}
          {log.signature ? (
            <View style={styles.signatureSection}>
              <Text style={styles.sectionTitle}>Signature</Text>
              <View style={styles.signatureBox}>
                <Image src={log.signature} style={styles.signatureImage} />
                {log.signatureDate ? (
                  <Text style={styles.signatureDate}>
                    Signed on {new Date(log.signatureDate).toLocaleDateString('en-US', {
                      timeZone: process.env.TIMEZONE || 'America/Chicago',
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Line Items Table */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Items Logged</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Description</Text>
                <Text style={[styles.tableHeaderCell, { width: 100 }]}>Item Number</Text>
                <Text style={[styles.tableHeaderCell, { width: 100 }]}>Repair Number</Text>
                <Text style={[styles.tableHeaderCell, { width: 80, textAlign: 'right' }]}>Cost</Text>
              </View>
              {log.lineItems && log.lineItems.length > 0 ? (
                log.lineItems.map((item, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.name || '-'}</Text>
                    <Text style={[styles.tableCell, { width: 100, fontFamily: 'Helvetica-Bold' }]}>{item.itemNumber || '-'}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.repairNumber || '-'}</Text>
                    <Text style={[styles.tableCellRight, { width: 80 }]}>
                      {item.repairCost ? formatCurrency(item.repairCost) : '-'}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', color: '#666' }]}>
                    No items logged
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Images */}
          {imageUrls && imageUrls.length > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Images</Text>
              <View style={styles.imagesGrid}>
                {imageUrls.map((url, idx) => (
                  <View key={idx} style={styles.imageBox}>
                    <Image src={url} style={styles.logImage} />
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
