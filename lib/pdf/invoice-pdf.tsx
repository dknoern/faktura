import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Font, Svg, Path, Circle, Line } from '@react-pdf/renderer';
import { Invoice, Tenant, formatCurrency, formatDate } from '@/lib/invoice-renderer';

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
  invoiceLabel: {
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
  // Addresses
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressCol: {
    width: '48%',
  },
  addressText: {
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 0,
  },
  billingLabel: {
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginBottom: 2,
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
  },
  tableHeaderDesc: {
    flex: 1,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableHeaderTotal: {
    width: 80,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
  },
  tableRowDesc: {
    flex: 1,
    fontSize: 9,
  },
  tableRowAmount: {
    width: 80,
    textAlign: 'right',
    fontSize: 9,
  },
  itemName: {
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  itemDetail: {
    color: '#666',
    fontSize: 8,
    marginBottom: 1,
  },
  itemMeta: {
    flexDirection: 'row',
    marginTop: 3,
  },
  itemMetaText: {
    fontSize: 8,
    marginRight: 16,
    paddingLeft: 8,
  },
  // Totals
  totalsContainer: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  totalsTable: {
    width: 220,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalsLabel: {
    textAlign: 'right',
    fontSize: 9,
  },
  totalsValue: {
    textAlign: 'right',
    fontSize: 9,
    width: 80,
  },
  totalDueLabel: {
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  totalDueValue: {
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    width: 80,
  },
  thankYou: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 9,
  },
  // Warranty / Return
  policySection: {
    marginTop: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  policyBlock: {
    marginBottom: 8,
  },
  policyLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    marginBottom: 2,
  },
  policyText: {
    color: '#666',
    fontSize: 8,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
  // Bank wire
  wireSection: {
    marginTop: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  wireLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  wireText: {
    fontSize: 8,
  },
});

interface InvoicePdfProps {
  invoice: Invoice;
  tenant: Tenant;
  logoUrl: string;
}

export function InvoicePdfDocument({ invoice, tenant, logoUrl }: InvoicePdfProps) {
  const formattedDate = formatDate(invoice.date);
  const formattedTotal = formatCurrency(invoice.total);

  const invoiceLabel = invoice.invoiceType === 'Partner'
    ? 'PARTNER INVOICE'
    : invoice.invoiceType === 'Memo'
      ? 'MEMO'
      : invoice.invoiceType === 'Estimate'
        ? 'ESTIMATE'
        : 'INVOICE';

  const invoiceNumberLabel = invoice.invoiceType === 'Partner'
    ? 'Partner Invoice'
    : invoice.invoiceType === 'Memo'
      ? 'Memo'
      : invoice.invoiceType === 'Estimate'
        ? 'Estimate'
        : 'Invoice';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
       <View style={{ transform: 'scale(0.9)', transformOrigin: 'top left', width: '111%' }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image src={logoUrl} style={styles.logo} />
            <Text style={styles.invoiceLabel}>{invoiceLabel}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLine}>{invoiceNumberLabel} #{invoice.invoiceNumber}</Text>
            <Text style={styles.headerLine}>Date: {formattedDate}</Text>
            {invoice.shipVia ? <Text style={styles.headerLine}>Ship Via: {invoice.shipVia}</Text> : null}
            {invoice.trackingNumber ? <Text style={styles.headerLine}>Tracking Number: {invoice.trackingNumber}</Text> : null}
            {invoice.salesPerson ? <Text style={styles.headerLine}>Sold By: {invoice.salesPerson}</Text> : null}
            {invoice.methodOfSale ? <Text style={styles.headerLine}>Method of Sale: {invoice.methodOfSale}</Text> : null}
            {invoice.paidBy ? <Text style={styles.headerLine}>Paid By: {invoice.paidBy}</Text> : null}
            {invoice.authNumber ? <Text style={styles.headerLine}>Auth #: {invoice.authNumber}</Text> : null}
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.addressRow}>
          <View style={styles.addressCol}>
            <Text style={styles.addressText}>{invoice.customerFirstName} {invoice.customerLastName}</Text>
            {invoice.shipAddress1 ? <Text style={styles.addressText}>{invoice.shipAddress1}</Text> : null}
            {invoice.shipAddress2 ? <Text style={styles.addressText}>{invoice.shipAddress2}</Text> : null}
            {invoice.shipAddress3 ? <Text style={styles.addressText}>{invoice.shipAddress3}</Text> : null}
            {(invoice.shipCity || invoice.shipState || invoice.shipZip) ? (
              <Text style={styles.addressText}>
                {invoice.shipCity || ''}{invoice.shipState ? ', ' + invoice.shipState : ''} {invoice.shipZip || ''}
              </Text>
            ) : null}
            {invoice.customerPhone ? <Text style={styles.addressText}>{invoice.customerPhone}</Text> : null}
            {invoice.customerEmail ? <Text style={styles.addressText}>{invoice.customerEmail}</Text> : null}
          </View>

          {!invoice.copyAddress && invoice.billingAddress1 ? (
            <View style={styles.addressCol}>
              <Text style={styles.billingLabel}>BILLING ADDRESS</Text>
              <Text style={styles.addressText}>{invoice.billingAddress1}</Text>
              {invoice.billingAddress2 ? <Text style={styles.addressText}>{invoice.billingAddress2}</Text> : null}
              {invoice.billingAddress3 ? <Text style={styles.addressText}>{invoice.billingAddress3}</Text> : null}
              {(invoice.billingCity || invoice.billingState || invoice.billingZip) ? (
                <Text style={styles.addressText}>
                  {invoice.billingCity || ''}{invoice.billingState ? ', ' + invoice.billingState : ''} {invoice.billingZip || ''}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderDesc}>ITEM DESCRIPTION</Text>
            <Text style={styles.tableHeaderTotal}>TOTAL</Text>
          </View>
          {invoice.lineItems.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.tableRowDesc}>
                <Text style={styles.itemName}>{item.name.toUpperCase()}</Text>
                {item.longDesc ? <Text style={styles.itemDetail}>{item.longDesc}</Text> : null}
                <View style={styles.itemMeta}>
                  {item.serialNumber ? <Text style={styles.itemMetaText}>Serial No: {item.serialNumber}</Text> : null}
                  {item.itemNumber ? <Text style={styles.itemMetaText}>SKU: {item.itemNumber}</Text> : null}
                </View>
              </View>
              <Text style={styles.tableRowAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>SUBTOTAL:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>TAX:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.tax)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>SHIPPING:</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.shipping)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalDueLabel}>TOTAL DUE:</Text>
              <Text style={styles.totalDueValue}>{formattedTotal}</Text>
            </View>
          </View>
          <Text style={styles.thankYou}>Thank you for your business</Text>
        </View>

        {/* Warranty and Return Policy */}
        <View style={styles.policySection}>
          <View style={styles.policyBlock}>
            <Text style={styles.policyLabel}>Warranty:</Text>
            <Text style={styles.policyText}>{tenant.warranty || 'N/A'}</Text>
          </View>
          <View style={styles.policyBlock}>
            <Text style={styles.policyLabel}>Return Privilege:</Text>
            <Text style={styles.policyText}>{tenant.returnPolicy || 'N/A'}</Text>
          </View>
        </View>

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
              <Text style={styles.footerLabel}>WEB</Text>
              <Text style={styles.footerText}>{tenant.website || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Bank Wire Transfer Instructions */}
        <View style={styles.wireSection}>
          <Text style={styles.wireLabel}>BANK WIRE TRANSFER INSTRUCTIONS</Text>
          <Text style={styles.wireText}>{tenant.bankWireTransferInstructions || 'N/A'}</Text>
        </View>
       </View>
      </Page>
    </Document>
  );
}
