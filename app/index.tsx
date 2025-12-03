/**
 * RegattaFlow Landing Page - Beautiful 3-tab landing experience
 * Migrated from Next.js to React Native Universal
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, Platform, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Head } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { getDashboardRoute } from '@/lib/utils/userTypeRouting';
import { HeroPhones } from '@/components/landing/HeroPhones';
import { ScrollFix } from '@/components/landing/ScrollFix';

export default function LandingPage() {
  const { signedIn, ready, userProfile, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for auth to be ready AND not loading profile
    if (!ready || loading || isRedirecting) return;

    // Only redirect if signed in AND profile is loaded (or explicitly null after loading)
    if (signedIn) {
      // If profile is still being fetched, wait for it
      // userProfile will be populated after signIn completes
      if (userProfile || (!loading && ready)) {
        setIsRedirecting(true);

        // Check if onboarding is needed
        const destination = getDashboardRoute(userProfile?.user_type ?? null);

        router.replace(destination);
      }
    }
  }, [signedIn, ready, userProfile, loading, isRedirecting]);

  // Show landing page immediately - don't wait for auth
  // (Auth redirect will happen in useEffect once ready)
  const Container = Platform.OS === 'web' ? View : SafeAreaView;
  const containerStyle = Platform.OS === 'web'
    ? [styles.container, styles.webContainer]
    : styles.container;

  return (
    <Container style={containerStyle}>
      <Head>
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="n53JxiUdY0k_64zSxt07pdPyM1kBuYhSRrXvDLzA_vE" />
        
        <title>RegattaFlow - AI-Powered Sailing Race Strategy & Performance</title>
        <meta name="description" content="Master sailing race strategy with AI-powered venue intelligence, real-time wind analysis, and personalized coaching. Track performance, plan races, and outsmart the competition." />
        <meta name="keywords" content="sailing, regatta, race strategy, sailing coach, wind shifts, venue intelligence, race planning, sailing performance, yacht racing, dinghy racing" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://regattaflow.oceanflow.io/" />
        <meta property="og:title" content="RegattaFlow - AI-Powered Sailing Race Strategy" />
        <meta property="og:description" content="Master sailing race strategy with AI-powered venue intelligence, real-time wind analysis, and personalized coaching." />
        <meta property="og:image" content="https://regattaflow.oceanflow.io/assets/images/og-image.png" />
        <meta property="og:site_name" content="RegattaFlow" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://regattaflow.oceanflow.io/" />
        <meta name="twitter:title" content="RegattaFlow - AI-Powered Sailing Race Strategy" />
        <meta name="twitter:description" content="Master sailing race strategy with AI-powered venue intelligence, real-time wind analysis, and personalized coaching." />
        <meta name="twitter:image" content="https://regattaflow.oceanflow.io/assets/images/og-image.png" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="RegattaFlow" />
        <link rel="canonical" href="https://regattaflow.oceanflow.io/" />
        
        {/* Structured Data for Software Application */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "RegattaFlow",
            "applicationCategory": "SportsApplication",
            "operatingSystem": "Web, iOS, Android",
            "description": "AI-powered sailing race strategy, performance tracking, and venue intelligence for competitive sailors worldwide",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "150"
            }
          })}
        </script>
      </Head>
      <ScrollFix />
      <HeroPhones />
    </Container>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  webContainer: ViewStyle;
  loadingContainer: ViewStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webContainer: {
    minHeight: '100vh' as any,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
