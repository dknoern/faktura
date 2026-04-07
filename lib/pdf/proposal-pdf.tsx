import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { Tenant } from '@/lib/invoice-renderer';
import { Proposal } from '@/lib/proposal-renderer';

const gold = '#B69D57';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333',
    padding: 40,
    lineHeight: 1.5,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  headerText: {
    flexDirection: 'column',
  },
  companyName: {
    color: gold,
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
  },
  proposalLabel: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#555',
  },
  // Date
  dateBadge: {
    marginBottom: 16,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  // Client info row
  infoRow: {
    flexDirection: 'row',
    gap: 120,
    marginBottom: 20,
  },
  infoBlock: {},
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
  },
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#dddddd',
    borderWidth: 1,
    borderColor: '#aaa',
  },
  tableHeaderItem: {
    flex: 1,
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  tableHeaderPrice: {
    width: 80,
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableCellItem: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  tableCellPrice: {
    width: 80,
    padding: 8,
    fontSize: 10,
    textAlign: 'right',
  },
  // Terms
  termsSection: {
    marginBottom: 24,
    fontSize: 10,
    lineHeight: 1.6,
  },
  // Signature block
  signatureSection: {
    marginBottom: 30,
    fontSize: 10,
  },
  signatureBold: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 14,
  },
  signatureLine: {
    marginBottom: 10,
  },
  // Footer
  footer: {
    marginTop: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
  },
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  const timeZone = process.env.TIMEZONE || 'America/Chicago';
  return new Date(dateString).toLocaleDateString('en-US', {
    timeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface ProposalPdfProps {
  proposal: Proposal;
  tenant: Tenant;
  logoUrl: string;
}

export function ProposalPdfDocument({ proposal, tenant, logoUrl }: ProposalPdfProps) {
  const companyName = tenant.nameLong || 'Company';
  const footerParts = [
    companyName,
    tenant.address,
    [tenant.city, tenant.state, tenant.zip].filter(Boolean).join(' '),
    tenant.phone,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={{ transform: 'scale(0.95)', transformOrigin: 'top left', width: '111%' }}>

          {/* Header */}
          <View style={styles.header}>
            <Image src={logoUrl} style={styles.logo} />
            <View style={styles.headerText}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.proposalLabel}>Proposal</Text>
            </View>
          </View>

          {/* Date Badge */}
          <Text style={styles.dateBadge}>{formatDate(proposal.date)}</Text>

          {/* Client Info & Status */}
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Client Information</Text>
              <Text style={styles.infoValue}>{proposal.customerFirstName} {proposal.customerLastName}</Text>
            </View>
            {proposal.status ? (
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>{proposal.status}</Text>
              </View>
            ) : null}
          </View>

          {/* Line Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderItem}>Item</Text>
              <Text style={styles.tableHeaderPrice}>Price</Text>
            </View>
            {proposal.lineItems.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCellItem}>
                  {item.longDesc || item.name}
                </Text>
                <Text style={styles.tableCellPrice}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>

          {/* Terms */}
          {tenant.proposalTerms ? (
            <View style={styles.termsSection}>
              {tenant.proposalTerms.split(/\n\s*\n/).map((paragraph, idx) => (
                <Text key={idx} style={{ marginBottom: 8 }}>{paragraph.trim()}</Text>
              ))}
            </View>
          ) : null}

          {/* Signature Block */}
          <View style={styles.signatureSection}>
            <Text style={styles.signatureBold}>
              The Contract, as stated above, is accepted by the owner (or realtor):
            </Text>
            <Text style={styles.signatureLine}>
              Owners or Realtor&apos;s Signature: ________________________________________
            </Text>
            <Text style={styles.signatureLine}>
              Mailing Address: ___________________________________________________
            </Text>
            <Text style={styles.signatureLine}>
              Telephone Number: _________________________________________________
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>{footerParts.join(' \u2013 ')}</Text>
          </View>

        </View>
      </Page>
    </Document>
  );
}
