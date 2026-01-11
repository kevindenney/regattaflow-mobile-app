/**
 * Institutional Card Component
 * Displays institutional/team pricing package information
 * Tufte-inspired: tightened with inline metadata
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { InstitutionalPackage } from '@/services/CourseCatalogService';

interface InstitutionalCardProps {
  package: InstitutionalPackage;
  isDesktop?: boolean;
  compact?: boolean; // Mobile carousel mode
  onContactSales?: () => void;
}

export function InstitutionalCard({ package: pkg, isDesktop = false, compact = false, onContactSales }: InstitutionalCardProps) {
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

  const userLimitText = pkg.userLimit === 'unlimited'
    ? 'Unlimited users'
    : `Up to ${pkg.userLimit} users`;

  return (
    <View style={[
      styles.institutionalCard,
      compact && styles.institutionalCardCompact,
      isDesktop && styles.institutionalCardDesktop
    ]}>
      {/* Header: Name + Price + Users inline */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={[styles.packageName, compact && styles.packageNameCompact]}>{pkg.name}</Text>
          <Text style={styles.usersInline}>{userLimitText}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.packagePrice, compact && styles.packagePriceCompact]}>
            ${(pkg.price.cents / 100).toFixed(0)}
          </Text>
          <Text style={styles.packagePriceLabel}>/mo</Text>
        </View>
      </View>

      {/* Features: Compact inline list */}
      <View style={styles.featuresList}>
        {pkg.includes.slice(0, compact ? 4 : 6).map((feature, idx) => (
          <View key={idx} style={styles.featureItem}>
            <Ionicons name="checkmark" size={14} color="#10B981" />
            <Text style={styles.featureText} numberOfLines={1}>{feature}</Text>
          </View>
        ))}
        {pkg.includes.length > (compact ? 4 : 6) && (
          <Text style={styles.moreFeatures}>
            +{pkg.includes.length - (compact ? 4 : 6)} more
          </Text>
        )}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.contactButton}
        activeOpacity={0.8}
        onPress={handleContactSales}
      >
        <Text style={styles.contactButtonText}>Contact Sales</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  institutionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      } as unknown,
      default: {
        elevation: 1,
      },
    }),
  },
  institutionalCardCompact: {
    padding: 14,
    marginBottom: 0,
  },
  institutionalCardDesktop: {
    width: '48%',
    minWidth: 280,
  },
  // Tufte: Header with name, users, and price inline
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  packageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  packageNameCompact: {
    fontSize: 16,
  },
  usersInline: {
    fontSize: 13,
    color: '#6B7280',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  packagePriceCompact: {
    fontSize: 20,
  },
  packagePriceLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 2,
  },
  // Tufte: Compact feature list
  featuresList: {
    gap: 6,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
  },
  moreFeatures: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginLeft: 20,
  },
  // Tufte: Compact CTA
  contactButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
});

