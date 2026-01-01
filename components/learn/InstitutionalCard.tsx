/**
 * Institutional Card Component
 * Displays institutional/team pricing package information
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { InstitutionalPackage } from '@/services/CourseCatalogService';

interface InstitutionalCardProps {
  package: InstitutionalPackage;
  isDesktop?: boolean;
  onContactSales?: () => void;
}

export function InstitutionalCard({ package: pkg, isDesktop = false, onContactSales }: InstitutionalCardProps) {
  const handleContactSales = () => {
    if (onContactSales) {
      onContactSales();
    } else {
      // Default behavior: open email
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = `mailto:sales@regattaflow.com?subject=Institutional Package Inquiry: ${pkg.name}`;
      } else {
        Linking.openURL(`mailto:sales@regattaflow.com?subject=Institutional Package Inquiry: ${pkg.name}`);
      }
    }
  };

  return (
    <View style={[styles.institutionalCard, isDesktop && styles.institutionalCardDesktop]}>
      <View style={styles.institutionalCardHeader}>
        <Text style={styles.packageName}>{pkg.name}</Text>
        <View style={styles.packagePriceRow}>
          <Text style={styles.packagePrice}>
            ${(pkg.price.cents / 100).toFixed(0)}
          </Text>
          <Text style={styles.packagePriceLabel}>/month</Text>
        </View>
      </View>

      <View style={styles.packageUsersBadge}>
        <Ionicons name="people" size={16} color="#2196F3" />
        <Text style={styles.packageUsersText}>
          {pkg.userLimit === 'unlimited'
            ? 'Unlimited users'
            : `Up to ${pkg.userLimit} users`}
        </Text>
      </View>

      <View style={styles.packageFeaturesList}>
        {pkg.includes.map((feature, idx) => (
          <View key={idx} style={styles.packageFeature}>
            <Ionicons name="checkmark" size={18} color="#10B981" />
            <Text style={styles.packageFeatureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.contactSalesButton}
        activeOpacity={0.8}
        onPress={handleContactSales}
      >
        <Text style={styles.contactSalesButtonText}>Contact Sales</Text>
        <Ionicons name="mail-outline" size={18} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  institutionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  institutionalCardDesktop: {
    width: '45%',
    minWidth: 320,
  },
  institutionalCardHeader: {
    marginBottom: 16,
  },
  packageName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  packagePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  packagePrice: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2196F3',
  },
  packagePriceLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  packageUsersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  packageUsersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  packageFeaturesList: {
    gap: 12,
    marginBottom: 24,
  },
  packageFeature: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  packageFeatureText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
  },
  contactSalesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  contactSalesButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
});

