/**
 * affiliationsStyles.ts
 *
 * Shared Tufte-style tokens for Affiliations screen.
 * Maximum data-ink ratio, typography-driven hierarchy.
 */

import { StyleSheet } from 'react-native';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';

export const AffiliationTokens = {
  // Status dot colors
  status: {
    member: IOS_COLORS.green,    // Active member
    reciprocal: IOS_COLORS.blue, // Reciprocal privileges
    pending: IOS_COLORS.orange,  // Pending approval
    inactive: IOS_COLORS.gray,   // Inactive/expired
  },
  // Typography
  fontSize: {
    title: 15,
    subtitle: 12,
    meta: 11,
    sectionHeader: 11,
  },
  // Spacing
  padding: {
    horizontal: 16,
    vertical: 12,
    section: 20,
  },
};

export const affiliationsStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Search bar
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: IOS_COLORS.label,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },

  // Section headers (UPPERCASE)
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: IOS_COLORS.secondaryLabel,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },

  // List container
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#E5E7EB',
  },

  // Row styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
  },
  rowSubtitle: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Status dot
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotMember: {
    backgroundColor: IOS_COLORS.green,
  },
  statusDotReciprocal: {
    backgroundColor: IOS_COLORS.blue,
  },
  statusDotPending: {
    backgroundColor: IOS_COLORS.orange,
  },
  statusDotInactive: {
    backgroundColor: IOS_COLORS.gray,
  },

  // Badges and tags
  badge: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },

  // Chevron
  chevron: {
    fontSize: 16,
    color: IOS_COLORS.tertiaryLabel,
    marginLeft: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});
