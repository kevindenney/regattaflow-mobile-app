import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { RegattaFlowLogo } from '@/components/RegattaFlowLogo';

export function SimpleLandingNav() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  // Track scroll position for background opacity
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <View
        style={[
          styles.nav,
          isScrolled && styles.navScrolled,
          Platform.OS === 'web' && (styles.navWeb as any),
        ]}
      >
        <View style={[styles.inner, isDesktop && styles.innerDesktop]}>
          {/* Logo */}
          <TouchableOpacity
            style={styles.logoRow}
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            accessibilityLabel="RegattaFlow home"
          >
            <RegattaFlowLogo size={32} variant="white" />
            <Text style={styles.logoText}>RegattaFlow</Text>
          </TouchableOpacity>

          {/* Desktop links */}
          {isDesktop ? (
            <View style={styles.desktopLinks}>
              <TouchableOpacity
                onPress={() => scrollToSection('how-it-works')}
              >
                <Text style={styles.navLink}>How It Works</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => scrollToSection('pricing-section')}
              >
                <Text style={styles.navLink}>Pricing</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.navLink}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.getStartedBtn}
                onPress={() => router.push('/(auth)/signup')}
              >
                <Text style={styles.getStartedText}>Get Started Free</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Mobile hamburger */
            <TouchableOpacity
              onPress={() => setMobileMenuOpen(true)}
              style={styles.hamburger}
              accessibilityLabel="Open navigation menu"
            >
              <Ionicons name="menu" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile menu modal */}
      {!isDesktop && (
        <Modal
          visible={mobileMenuOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setMobileMenuOpen(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMobileMenuOpen(false)}
          >
            <Pressable style={styles.mobileMenu} onPress={() => {}}>
              {/* Close button */}
              <View style={styles.mobileMenuHeader}>
                <View style={styles.logoRow}>
                  <RegattaFlowLogo size={28} variant="white" />
                  <Text style={styles.logoText}>RegattaFlow</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMobileMenuOpen(false)}
                  accessibilityLabel="Close menu"
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Menu items */}
              <View style={styles.mobileMenuItems}>
                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={() => scrollToSection('how-it-works')}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={22}
                    color="#93C5FD"
                  />
                  <Text style={styles.mobileMenuText}>How It Works</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={() => scrollToSection('pricing-section')}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={22}
                    color="#93C5FD"
                  />
                  <Text style={styles.mobileMenuText}>Pricing</Text>
                </TouchableOpacity>

                <View style={styles.mobileMenuDivider} />

                <TouchableOpacity
                  style={styles.mobileMenuItem}
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/(auth)/login');
                  }}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={22}
                    color="#93C5FD"
                  />
                  <Text style={styles.mobileMenuText}>Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mobileGetStarted}
                  onPress={() => {
                    setMobileMenuOpen(false);
                    router.push('/(auth)/signup');
                  }}
                >
                  <Text style={styles.mobileGetStartedText}>
                    Get Started Free
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  navScrolled: {
    backgroundColor: 'rgba(10, 36, 99, 0.95)',
  },
  navWeb: {
    position: 'fixed',
    backdropFilter: 'blur(8px)',
  } as any,

  inner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  innerDesktop: {},

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  desktopLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      web: { cursor: 'pointer', transition: 'color 0.2s' },
    }),
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  getStartedBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  getStartedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A2463',
  },

  hamburger: {
    padding: 4,
  },

  // Mobile menu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileMenu: {
    backgroundColor: '#0A2463',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  mobileMenuItems: {
    gap: 8,
  },
  mobileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  mobileMenuText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mobileMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  mobileGetStarted: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  mobileGetStartedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A2463',
  },
});
