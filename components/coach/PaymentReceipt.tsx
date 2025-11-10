import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Share,
} from 'react-native';
import { CoachingSession } from '../../types/coach';

interface PaymentReceiptProps {
  session: CoachingSession;
  visible: boolean;
  onClose: () => void;
}

export default function PaymentReceipt({ session, visible, onClose }: PaymentReceiptProps) {
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const totalAmount =
    typeof session.total_amount === 'number' && !Number.isNaN(session.total_amount)
      ? session.total_amount
      : 0;
  const coachPayout =
    typeof session.coach_payout === 'number' && !Number.isNaN(session.coach_payout)
      ? session.coach_payout
      : 0;
  const platformFee =
    typeof session.platform_fee === 'number' && !Number.isNaN(session.platform_fee)
      ? session.platform_fee
      : Math.max(0, totalAmount - coachPayout);

  const generateReceiptText = () => {
    const { date, time } = formatDateTime(session.scheduled_start);
    const paymentDate = session.created_at ? new Date(session.created_at).toLocaleDateString() : 'N/A';

    return `
RegattaFlow Coach Marketplace
Payment Receipt

Session: ${session.title}
Date: ${date}
Time: ${time}

Payment Details:
Session Fee: ${formatPrice(totalAmount)}
Platform Fee: ${formatPrice(platformFee)}
Total: ${formatPrice(totalAmount)}

Payment Date: ${paymentDate}
Transaction ID: ${session.stripe_payment_intent_id || 'N/A'}
Status: ${session.payment_status}

Thank you for using RegattaFlow!
    `.trim();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: generateReceiptText(),
        title: 'RegattaFlow Payment Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const { date, time } = formatDateTime(session.scheduled_start);
  const paymentDate = session.created_at
    ? new Date(session.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const getStatusColor = () => {
    switch (session.payment_status) {
      case 'captured':
        return '#00AA33';
      case 'refunded':
        return '#FF6B35';
      case 'pending':
        return '#FFA500';
      default:
        return '#666';
    }
  };

  const getStatusText = () => {
    switch (session.payment_status) {
      case 'captured':
        return 'Paid';
      case 'refunded':
        return 'Refunded';
      case 'pending':
        return 'Pending';
      default:
        return session.payment_status;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <TouchableOpacity onPress={handleShare}>
            <Text style={styles.shareButton}>Share</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Receipt Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.companyName}>RegattaFlow</Text>
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          </View>

          {/* Session Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Session</Text>
              <Text style={styles.infoValue}>{session.title}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>{date} at {time}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>
                {Math.round((new Date(session.scheduled_end).getTime() - new Date(session.scheduled_start).getTime()) / (1000 * 60))} minutes
              </Text>
            </View>

            {session.student_goals && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Goals</Text>
                <Text style={styles.infoValue} numberOfLines={3}>
                  {session.student_goals}
                </Text>
              </View>
            )}
          </View>

          {/* Payment Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Breakdown</Text>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Session Fee</Text>
              <Text style={styles.paymentValue}>
                {formatPrice(Math.max(0, totalAmount - platformFee))}
              </Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Platform Fee</Text>
              <Text style={styles.paymentValue}>
                {formatPrice(platformFee)}
              </Text>
            </View>

            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(totalAmount)}
              </Text>
            </View>
          </View>

          {/* Transaction Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Details</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Date</Text>
              <Text style={styles.infoValue}>{paymentDate}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>Credit Card</Text>
            </View>

            {session.stripe_payment_intent_id && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transaction ID</Text>
                <Text style={[styles.infoValue, styles.transactionId]}>
                  {session.stripe_payment_intent_id}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Thank you for using RegattaFlow Coach Marketplace!
            </Text>
            <Text style={styles.footerSubtext}>
              Questions? Contact support@regattaflow.com
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    fontSize: 16,
    color: '#666',
    width: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  shareButton: {
    fontSize: 16,
    color: '#0066CC',
    width: 60,
    textAlign: 'right',
  },
  content: {
    padding: 20,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
    marginBottom: 32,
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  transactionId: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  paymentValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    marginTop: 32,
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0',
  },
  footerText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
