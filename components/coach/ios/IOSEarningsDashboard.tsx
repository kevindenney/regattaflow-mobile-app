/**
 * IOSEarningsDashboard - Wallet-Style Earnings
 *
 * Apple Card/Wallet-style earnings dashboard:
 * - Hero card with large amount and trend
 * - Monthly spending chart
 * - Transaction list grouped by date
 * - Green for income, red for fees/refunds
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  SectionList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

// Types
interface Transaction {
  id: string;
  type: 'payment' | 'payout' | 'fee' | 'refund';
  description: string;
  amount: number;
  date: Date;
  clientName?: string;
  status?: 'pending' | 'completed' | 'failed';
}

interface MonthlyData {
  month: string;
  earnings: number;
  sessions: number;
}

interface IOSEarningsDashboardProps {
  totalEarnings: number;
  pendingPayout: number;
  monthlyChange: number; // percentage
  monthlyData: MonthlyData[];
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  onRequestPayout?: () => void;
  onViewDetails?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Transaction type configuration
function getTransactionTypeInfo(type: Transaction['type']): {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  prefix: string;
} {
  switch (type) {
    case 'payment':
      return { icon: 'card', color: IOS_COLORS.systemGreen, prefix: '+' };
    case 'payout':
      return { icon: 'arrow-down-circle', color: IOS_COLORS.systemBlue, prefix: '-' };
    case 'fee':
      return { icon: 'receipt', color: IOS_COLORS.systemOrange, prefix: '-' };
    case 'refund':
      return { icon: 'refresh-circle', color: IOS_COLORS.systemRed, prefix: '-' };
    default:
      return { icon: 'ellipse', color: IOS_COLORS.systemGray, prefix: '' };
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
}

// Mini Bar Chart
interface BarChartProps {
  data: MonthlyData[];
  width?: number;
  height?: number;
}

function BarChart({ data, width = 320, height = 120 }: BarChartProps) {
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.earnings), 1);
  const barWidth = chartWidth / data.length - 8;

  return (
    <Svg width={width} height={height}>
      {/* Bars */}
      {data.map((item, index) => {
        const barHeight = (item.earnings / maxValue) * chartHeight;
        const x = padding.left + (index * (chartWidth / data.length)) + 4;
        const y = padding.top + chartHeight - barHeight;

        return (
          <React.Fragment key={item.month}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={index === data.length - 1 ? IOS_COLORS.systemGreen : IOS_COLORS.systemGray4}
            />
            <SvgText
              x={x + barWidth / 2}
              y={height - 8}
              fontSize={10}
              fill={IOS_COLORS.secondaryLabel}
              textAnchor="middle"
            >
              {item.month}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Baseline */}
      <Line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        stroke={IOS_COLORS.separator}
        strokeWidth={1}
      />
    </Svg>
  );
}

// Transaction Row
interface TransactionRowProps {
  transaction: Transaction;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function TransactionRow({ transaction, onPress, isFirst, isLast }: TransactionRowProps) {
  const scale = useSharedValue(1);
  const typeInfo = getTransactionTypeInfo(transaction.type);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const amountColor = transaction.type === 'payment'
    ? IOS_COLORS.systemGreen
    : transaction.type === 'refund'
    ? IOS_COLORS.systemRed
    : IOS_COLORS.label;

  return (
    <AnimatedPressable
      style={[
        styles.transactionRow,
        isFirst && styles.rowFirst,
        isLast && styles.rowLast,
        animatedStyle,
      ]}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <View style={[styles.transactionIcon, { backgroundColor: `${typeInfo.color}15` }]}>
        <Ionicons name={typeInfo.icon} size={18} color={typeInfo.color} />
      </View>

      <View style={styles.transactionContent}>
        <Text style={styles.transactionDescription} numberOfLines={1}>
          {transaction.description}
        </Text>
        {transaction.clientName && (
          <Text style={styles.transactionClient}>{transaction.clientName}</Text>
        )}
      </View>

      <View style={styles.transactionTrailing}>
        <Text style={[styles.transactionAmount, { color: amountColor }]}>
          {typeInfo.prefix}{formatCurrency(Math.abs(transaction.amount))}
        </Text>
        {transaction.status === 'pending' && (
          <Text style={styles.transactionStatus}>Pending</Text>
        )}
      </View>
    </AnimatedPressable>
  );
}

// Month Selector
interface MonthSelectorProps {
  months: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function MonthSelector({ months, selectedIndex, onSelect }: MonthSelectorProps) {
  return (
    <View style={styles.monthSelector}>
      <Pressable
        style={styles.monthNavButton}
        onPress={() => {
          if (selectedIndex > 0) {
            triggerHaptic('selection');
            onSelect(selectedIndex - 1);
          }
        }}
        disabled={selectedIndex === 0}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={selectedIndex === 0 ? IOS_COLORS.systemGray4 : IOS_COLORS.systemBlue}
        />
      </Pressable>

      <Text style={styles.monthLabel}>{months[selectedIndex]}</Text>

      <Pressable
        style={styles.monthNavButton}
        onPress={() => {
          if (selectedIndex < months.length - 1) {
            triggerHaptic('selection');
            onSelect(selectedIndex + 1);
          }
        }}
        disabled={selectedIndex === months.length - 1}
      >
        <Ionicons
          name="chevron-forward"
          size={20}
          color={selectedIndex === months.length - 1 ? IOS_COLORS.systemGray4 : IOS_COLORS.systemBlue}
        />
      </Pressable>
    </View>
  );
}

// Main Component
export function IOSEarningsDashboard({
  totalEarnings,
  pendingPayout,
  monthlyChange,
  monthlyData,
  transactions,
  onTransactionPress,
  onRequestPayout,
  onViewDetails,
}: IOSEarningsDashboardProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(monthlyData.length - 1);

  // Group transactions by date
  const transactionSections = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};

    transactions.forEach((t) => {
      const dateKey = t.date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(t);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dateKey, data]) => ({
        title: formatDateHeader(new Date(dateKey)),
        data: data.sort((a, b) => b.date.getTime() - a.date.getTime()),
      }));
  }, [transactions]);

  const isPositiveChange = monthlyChange >= 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>Total Earnings</Text>
            <Text style={styles.heroAmount}>{formatCurrency(totalEarnings)}</Text>
            <View style={styles.heroTrend}>
              <Ionicons
                name={isPositiveChange ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={isPositiveChange ? '#4ade80' : '#f87171'}
              />
              <Text
                style={[
                  styles.heroTrendText,
                  { color: isPositiveChange ? '#4ade80' : '#f87171' },
                ]}
              >
                {Math.abs(monthlyChange)}% this month
              </Text>
            </View>
          </View>

          {/* Pending Payout */}
          <View style={styles.pendingSection}>
            <View style={styles.pendingInfo}>
              <Text style={styles.pendingLabel}>Available for Payout</Text>
              <Text style={styles.pendingAmount}>{formatCurrency(pendingPayout)}</Text>
            </View>
            {onRequestPayout && pendingPayout > 0 && (
              <Pressable
                style={styles.payoutButton}
                onPress={() => {
                  triggerHaptic('impactMedium');
                  onRequestPayout();
                }}
              >
                <Text style={styles.payoutButtonText}>Request</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>

        {/* Monthly Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MONTHLY EARNINGS</Text>
            {onViewDetails && (
              <Pressable onPress={onViewDetails}>
                <Text style={styles.viewDetailsText}>Details</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.chartCard}>
            <MonthSelector
              months={monthlyData.map((d) => d.month)}
              selectedIndex={selectedMonthIndex}
              onSelect={setSelectedMonthIndex}
            />

            <View style={styles.monthStats}>
              <View style={styles.monthStat}>
                <Text style={styles.monthStatValue}>
                  {formatCurrency(monthlyData[selectedMonthIndex]?.earnings || 0)}
                </Text>
                <Text style={styles.monthStatLabel}>Earnings</Text>
              </View>
              <View style={styles.monthStatDivider} />
              <View style={styles.monthStat}>
                <Text style={styles.monthStatValue}>
                  {monthlyData[selectedMonthIndex]?.sessions || 0}
                </Text>
                <Text style={styles.monthStatLabel}>Sessions</Text>
              </View>
            </View>

            <View style={styles.chartContainer}>
              <BarChart data={monthlyData} />
            </View>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRANSACTIONS</Text>
        </View>
      </ScrollView>

      {/* Transactions List */}
      <SectionList
        sections={transactionSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index, section }) => (
          <TransactionRow
            transaction={item}
            onPress={() => onTransactionPress?.(item)}
            isFirst={index === 0}
            isLast={index === section.data.length - 1}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.transactionSectionHeader}>
            <Text style={styles.transactionSectionTitle}>{section.title}</Text>
          </View>
        )}
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyTransactions}>
            <Ionicons name="receipt-outline" size={48} color={IOS_COLORS.systemGray3} />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptySubtitle}>
              Your transaction history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  scrollView: {
    flex: 0,
  },
  scrollContent: {
    paddingBottom: IOS_SPACING.md,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: IOS_SPACING.lg,
    marginTop: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.lg,
    padding: IOS_SPACING.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: IOS_SPACING.lg,
  },
  heroLabel: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: IOS_SPACING.xs,
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heroTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: IOS_SPACING.sm,
  },
  heroTrendText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
  },
  pendingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: IOS_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pendingInfo: {},
  pendingLabel: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  pendingAmount: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  payoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.md,
  },
  payoutButtonText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Section
  section: {
    marginTop: IOS_SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  sectionTitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
    paddingHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  viewDetailsText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },

  // Chart Card
  chartCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    padding: IOS_SPACING.lg,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.md,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    minWidth: 120,
    textAlign: 'center',
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: IOS_SPACING.xl,
    marginBottom: IOS_SPACING.md,
  },
  monthStat: {
    alignItems: 'center',
  },
  monthStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: IOS_COLORS.separator,
  },
  monthStatValue: {
    fontSize: IOS_TYPOGRAPHY.title2.fontSize,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  monthStatLabel: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
  },

  // Transactions List
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingBottom: IOS_SPACING.xxxl,
  },
  transactionSectionHeader: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.sm,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  transactionSectionTitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  rowFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  rowLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
    marginBottom: IOS_SPACING.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionContent: {
    flex: 1,
    minWidth: 0,
  },
  transactionDescription: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  transactionClient: {
    fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  transactionTrailing: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
  },
  transactionStatus: {
    fontSize: IOS_TYPOGRAPHY.caption2.fontSize,
    color: IOS_COLORS.systemOrange,
    marginTop: 2,
  },

  // Empty State
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: IOS_SPACING.xxxl,
    paddingHorizontal: IOS_SPACING.xl,
  },
  emptyTitle: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginTop: IOS_SPACING.md,
    marginBottom: IOS_SPACING.xs,
  },
  emptySubtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

export default IOSEarningsDashboard;
