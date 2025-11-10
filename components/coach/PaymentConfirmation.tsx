import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { CoachingSession, CoachProfile } from '../../types/coach';

interface PaymentConfirmationProps {
  session: CoachingSession;
  coach: CoachProfile;
  visible: boolean;
  onClose: () => void;
  onViewSessions: () => void;
}

export default function PaymentConfirmation({
  session,
  coach,
  visible,
  onClose,
  onViewSessions,
}: PaymentConfirmationProps) {
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

  const { date, time } = formatDateTime(session.scheduled_start);
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* Success Header */}
            <View style={styles.header}>
              <View style={styles.successIcon}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
              <Text style={styles.title}>Payment Successful!</Text>
              <Text style={styles.subtitle}>
                Your coaching session has been confirmed
              </Text>
            </View>

            {/* Session Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Session Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Coach</Text>
                <Text style={styles.detailValue}>
                  {coach.first_name} {coach.last_name}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Session</Text>
                <Text style={styles.detailValue}>{session.title}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{date}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{time}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Goals</Text>
                <Text style={styles.detailValue} numberOfLines={3}>
                  {session.student_goals}
                </Text>
              </View>
            </View>

            {/* Payment Summary */}
            <View style={styles.paymentCard}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Session Fee</Text>
                <Text style={styles.paymentValue}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Platform Fee</Text>
                <Text style={styles.paymentValue}>
                  {formatPrice(platformFee)}
                </Text>
              </View>

              <View style={[styles.paymentRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>

              {session.stripe_payment_intent_id && (
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionLabel}>Transaction ID</Text>
                  <Text style={styles.transactionId}>
                    {session.stripe_payment_intent_id.slice(0, -8)}...
                  </Text>
                </View>
              )}
            </View>

            {/* Next Steps */}
            <View style={styles.nextStepsCard}>
              <Text style={styles.sectionTitle}>What's Next?</Text>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>
                  You'll receive a confirmation email with session details
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>
                  Your coach will contact you before the session
                </Text>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>
                  Join your session using the link in your sessions list
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>Done</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onViewSessions}
            >
              <Text style={styles.primaryButtonText}>View Sessions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    maxWidth: 400,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00AA33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  paymentCard: {
    backgroundColor: '#E6F3FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  nextStepsCard: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
  },
  transactionInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 12,
    color: '#1A1A1A',
    fontFamily: 'monospace',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00AA33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066CC',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
