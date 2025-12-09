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
import { router } from 'expo-router';

const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/in/kevindenney',
  instagram: 'https://instagram.com/regattaflow',
  youtube: 'https://youtube.com/@regattaflow',
  twitter: 'https://twitter.com/regattaflow',
};

const FOOTER_LINKS = {
  product: [
    { label: 'For Sailors', href: '/#sailors' },
    { label: 'For Coaches', href: '/#coaches' },
    { label: 'For Clubs', href: '/#clubs' },
    { label: 'Pricing', href: '/pricing' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: 'mailto:hello@regattaflow.io' },
  ],
  resources: [
    { label: 'Help Center', href: '/support' },
    { label: 'Documentation', href: '/docs' },
    { label: 'API', href: '/developers' },
    { label: 'Status', href: 'https://status.regattaflow.io' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookies', href: '/cookies' },
  ],
};

export function Footer() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;
  const isTablet = mounted && width > 480;

  const openLink = (url: string) => {
    if (Platform.OS === 'web') {
      if (url.startsWith('mailto:')) {
        window.location.href = url;
      } else if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        router.push(url as any);
      }
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Wave decoration */}
      <View style={styles.waveContainer}>
        <View style={styles.wave} />
      </View>

      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        {/* Top Section - Brand & Social */}
        <View style={[styles.topSection, isDesktop && styles.topSectionDesktop]}>
          {/* Brand */}
          <View style={[styles.brandSection, isDesktop && styles.brandSectionDesktop]}>
            <View style={styles.logoRow}>
              <Ionicons name="water-outline" size={28} color="#3E92CC" />
              <Text style={styles.logoText}>RegattaFlow</Text>
            </View>
            <Text style={styles.tagline}>
              The Complete Sailing Ecosystem
            </Text>
            <Text style={styles.description}>
              Empowering sailors, coaches, and yacht clubs with AI-powered race strategy, 
              performance analytics, and seamless regatta management.
            </Text>

            {/* Social Links */}
            <View style={styles.socialLinks}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openLink(SOCIAL_LINKS.linkedin)}
                accessibilityLabel="Follow us on LinkedIn"
              >
                <Ionicons name="logo-linkedin" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openLink(SOCIAL_LINKS.instagram)}
                accessibilityLabel="Follow us on Instagram"
              >
                <Ionicons name="logo-instagram" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openLink(SOCIAL_LINKS.youtube)}
                accessibilityLabel="Subscribe on YouTube"
              >
                <Ionicons name="logo-youtube" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openLink(SOCIAL_LINKS.twitter)}
                accessibilityLabel="Follow us on Twitter"
              >
                <Ionicons name="logo-twitter" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Links Grid */}
          <View style={[styles.linksGrid, isDesktop && styles.linksGridDesktop]}>
            {/* Product Links */}
            <View style={styles.linkColumn}>
              <Text style={styles.linkColumnTitle}>Product</Text>
              {FOOTER_LINKS.product.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => openLink(link.href)}
                  style={styles.linkItem}
                >
                  <Text style={styles.linkText}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Company Links */}
            <View style={styles.linkColumn}>
              <Text style={styles.linkColumnTitle}>Company</Text>
              {FOOTER_LINKS.company.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => openLink(link.href)}
                  style={styles.linkItem}
                >
                  <Text style={styles.linkText}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resources Links */}
            <View style={styles.linkColumn}>
              <Text style={styles.linkColumnTitle}>Resources</Text>
              {FOOTER_LINKS.resources.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => openLink(link.href)}
                  style={styles.linkItem}
                >
                  <Text style={styles.linkText}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Legal Links */}
            <View style={styles.linkColumn}>
              <Text style={styles.linkColumnTitle}>Legal</Text>
              {FOOTER_LINKS.legal.map((link) => (
                <TouchableOpacity
                  key={link.label}
                  onPress={() => openLink(link.href)}
                  style={styles.linkItem}
                >
                  <Text style={styles.linkText}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Newsletter Signup */}
        <View style={[styles.newsletterSection, isDesktop && styles.newsletterSectionDesktop]}>
          <View style={styles.newsletterContent}>
            <Ionicons name="mail-outline" size={24} color="#3E92CC" />
            <View style={styles.newsletterText}>
              <Text style={styles.newsletterTitle}>Stay in the loop</Text>
              <Text style={styles.newsletterSubtitle}>
                Get race strategy tips, product updates, and sailing insights.
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.newsletterButton}
            onPress={() => openLink('mailto:newsletter@regattaflow.io?subject=Newsletter Signup')}
          >
            <Text style={styles.newsletterButtonText}>Subscribe</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Bar */}
        <View style={[styles.bottomBar, isDesktop && styles.bottomBarDesktop]}>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} RegattaFlow. All rights reserved.
          </Text>
          
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={() => openLink('/privacy')}>
              <Text style={styles.bottomLinkText}>Privacy</Text>
            </TouchableOpacity>
            <Text style={styles.bottomDivider}>•</Text>
            <TouchableOpacity onPress={() => openLink('/terms')}>
              <Text style={styles.bottomLinkText}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.bottomDivider}>•</Text>
            <TouchableOpacity onPress={() => openLink('/cookies')}>
              <Text style={styles.bottomLinkText}>Cookies</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A2463',
    position: 'relative',
  },
  waveContainer: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: '#0A2463',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    transform: [{ scaleX: 3 }],
  },
  content: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  contentDesktop: {
    paddingTop: 80,
    paddingBottom: 40,
  },

  // Top Section
  topSection: {
    gap: 48,
    marginBottom: 48,
  },
  topSectionDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 64,
  },

  // Brand Section
  brandSection: {
    maxWidth: 360,
    marginBottom: 32,
  },
  brandSectionDesktop: {
    marginBottom: 0,
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    color: '#93C5FD',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#BFDBFE',
    lineHeight: 22,
    marginBottom: 24,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },

  // Links Grid
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
  },
  linksGridDesktop: {
    flexWrap: 'nowrap',
    gap: 48,
  },
  linkColumn: {
    minWidth: 140,
  },
  linkColumnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkItem: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#BFDBFE',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'color 0.2s ease',
      },
    }),
  },

  // Newsletter Section
  newsletterSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    marginBottom: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  newsletterSectionDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsletterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  newsletterText: {
    flex: 1,
  },
  newsletterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  newsletterSubtitle: {
    fontSize: 14,
    color: '#BFDBFE',
  },
  newsletterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E92CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      },
    }),
  },
  newsletterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Bottom Bar
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 24,
    gap: 16,
    alignItems: 'center',
  },
  bottomBarDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyright: {
    fontSize: 14,
    color: '#93C5FD',
  },
  bottomLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomLinkText: {
    fontSize: 14,
    color: '#BFDBFE',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  bottomDivider: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

