import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

// Local photo asset
const FOUNDER_PHOTO = require('@/assets/images/kevindenney.jpeg');

const FOUNDER_CONFIG = {
  name: 'Kevin Denney',
  title: 'Founder & Sailing Coach',
  bio: `I grew up sailing on the Great Lakes and have been racing competitively for over 30 years—from Optimists and Hobie Cats as a kid, to FJs at Michigan State, to T-10s, J-105s, Etchells, and Dragons in Chicago.

After training with Steve Colgate's Offshore Sailing School and coaching with NorthU alongside Bill Gladstone, I saw a pattern: passionate club racers kept making the same mistakes because they didn't have tools for deliberate practice between coaching sessions.

I built RegattaFlow to bridge that gap—combining proven coaching methodology with modern technology to give every sailor the same advantages that elite teams have. Whether you're trying to crack the top 3 at your club or preparing for a championship, the right tools make all the difference.`,
  linkedIn: 'https://www.linkedin.com/in/kevindenney',
  twitter: 'https://twitter.com/regattaflow',
  email: 'kevin@oceanflow.io',
  whatsapp: '+85268420537',
  credentials: [
    'Former NorthU Coach',
    'Offshore Sailing School',
    'IIT Institute of Design',
    '30+ Years Racing',
  ],
};

export function FounderSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  const openLink = (url: string) => {
    if (Platform.OS === 'web') {
      if (url.startsWith('mailto:')) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Section Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="person-outline" size={16} color="#8B5CF6" />
            <Text style={styles.badgeText}>Meet the Founder</Text>
          </View>
          <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>
            Built by Sailors, for Sailors
          </Text>
        </View>

        {/* Founder Card */}
        <View style={[styles.founderCard, isDesktop && styles.founderCardDesktop]}>
          {/* Photo & Basic Info */}
          <View style={[styles.founderInfo, isDesktop && styles.founderInfoDesktop]}>
            {/* Photo */}
            <View style={[styles.photoContainer, isDesktop && styles.photoContainerDesktop]}>
              <Image
                source={FOUNDER_PHOTO}
                style={styles.photo}
                contentFit="cover"
              />
              {/* Sailing-themed decoration */}
              <View style={styles.decorationRing} />
            </View>

            {/* Name & Title */}
            <View style={[styles.nameSection, isDesktop && styles.nameSectionDesktop]}>
              <Text style={styles.founderName}>{FOUNDER_CONFIG.name}</Text>
              <Text style={styles.founderTitle}>{FOUNDER_CONFIG.title}</Text>
              
              {/* Credentials */}
              <View style={styles.credentialsList}>
                {FOUNDER_CONFIG.credentials.map((credential, index) => (
                  <View key={index} style={styles.credentialBadge}>
                    <Text style={styles.credentialText}>{credential}</Text>
                  </View>
                ))}
              </View>

              {/* Social Links */}
              <View style={styles.socialLinks}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openLink(FOUNDER_CONFIG.linkedIn)}
                  accessibilityLabel="LinkedIn Profile"
                >
                  <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openLink(`https://wa.me/${FOUNDER_CONFIG.whatsapp}`)}
                  accessibilityLabel="WhatsApp"
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => openLink(`mailto:${FOUNDER_CONFIG.email}`)}
                  accessibilityLabel="Email Founder"
                >
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bio */}
          <View style={[styles.bioSection, isDesktop && styles.bioSectionDesktop]}>
            <Text style={styles.bioText}>{FOUNDER_CONFIG.bio}</Text>
            
            {/* CTA Buttons */}
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => openLink(`mailto:${FOUNDER_CONFIG.email}?subject=Hello from RegattaFlow`)}
              >
                <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                <Text style={styles.connectButtonText}>Email me</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={() => openLink(`https://wa.me/${FOUNDER_CONFIG.whatsapp}`)}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.connectButtonText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Personal Touch Quote */}
        <View style={styles.quoteSection}>
          <View style={styles.quoteDecoration}>
            <Ionicons name="boat-outline" size={24} color="#3E92CC" />
          </View>
          <Text style={styles.personalQuote}>
            "I believe every club racer can get better with the right coaching 
            and the right tools. The winners aren't just sailing more—they're 
            studying the game. RegattaFlow gives you that edge."
          </Text>
          <Text style={styles.quoteAttribution}>— Kevin Denney, Founder</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  content: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  contentDesktop: {
    // Additional desktop styles
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7E22CE',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  sectionTitleDesktop: {
    fontSize: 40,
  },

  // Founder Card
  founderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 32,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  founderCardDesktop: {
    flexDirection: 'row',
    padding: 48,
    gap: 48,
  },

  // Founder Info (Photo & Name)
  founderInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  founderInfoDesktop: {
    marginBottom: 0,
    alignItems: 'center',
  },

  // Photo
  photoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  photoContainerDesktop: {
    marginBottom: 24,
  },
  photo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E5E7EB',
  },
  photoPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  decorationRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 88,
    borderWidth: 2,
    borderColor: '#3E92CC',
    opacity: 0.3,
  },

  // Name Section
  nameSection: {
    alignItems: 'center',
  },
  nameSectionDesktop: {
    alignItems: 'center',
  },
  founderName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  founderTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },

  // Credentials
  credentialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  credentialBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  credentialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },

  // Social Links
  socialLinks: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
      },
      default: {
        elevation: 2,
      },
    }),
  },

  // Bio Section
  bioSection: {
    flex: 1,
  },
  bioSectionDesktop: {
    flex: 2,
    paddingLeft: 32,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  bioText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 28,
    marginBottom: 24,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E92CC',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      },
    }),
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      },
    }),
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Quote Section
  quoteSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3E92CC',
  },
  quoteDecoration: {
    marginBottom: 16,
  },
  personalQuote: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 16,
    maxWidth: 700,
  },
  quoteAttribution: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

