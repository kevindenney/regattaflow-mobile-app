import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';

interface ClubEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
}

interface EventsListProps {
  events: ClubEvent[];
}

const eventTypeColors: { [key: string]: string } = {
  race: '#2196F3',
  regatta: '#1976D2',
  social: '#FF9800',
  training: '#4CAF50',
  meeting: '#9C27B0',
  maintenance: '#607D8B',
};

const eventTypeIcons: { [key: string]: string } = {
  race: '🏁',
  regatta: '⛵',
  social: '🎉',
  training: '📚',
  meeting: '👥',
  maintenance: '🔧',
};

const getEventColor = (type: string): string => {
  const normalized = type.toLowerCase().trim();
  return eventTypeColors[normalized] || '#757575';
};

const getEventIcon = (type: string): string => {
  const normalized = type.toLowerCase().trim();
  return eventTypeIcons[normalized] || '📅';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function EventsList({ events }: EventsListProps) {
  if (!events || events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No upcoming events</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.eventIcon}>
              <Text style={styles.iconText}>{getEventIcon(event.type)}</Text>
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventMeta}>
                <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                <Text style={styles.eventTime}>{formatTime(event.date)}</Text>
                <View
                  style={[
                    styles.eventTypeBadge,
                    { backgroundColor: getEventColor(event.type) },
                  ]}
                >
                  <Text style={styles.eventTypeText}>{event.type}</Text>
                </View>
              </View>
            </View>
          </View>
          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  eventCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventDate: {
    fontSize: 13,
    color: '#666',
  },
  eventTime: {
    fontSize: 13,
    color: '#666',
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventTypeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  eventDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
});
