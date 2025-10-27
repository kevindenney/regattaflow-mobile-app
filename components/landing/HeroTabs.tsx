import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { NavigationHeader } from '@/components/navigation/NavigationHeader';
import { SailorRaceStrategyMap } from './maps/SailorRaceStrategyMap';
import { YachtClubManagementMap } from './maps/YachtClubManagementMap';
import { CoachRaceReplay } from './maps/CoachRaceReplay';

type UserType = 'sailors' | 'yacht-clubs' | 'coaches';

interface TabContent {
  badge: string;
  title: string;
  subtitle: string;
  features: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    text: string;
    color: string;
  }>;
  mapComponent: () => React.ReactNode;
  ctaText: string;
  ctaSecondary: string;

  // Phone section content
  phoneTitle: string;
  phoneSubtitle: string;
  phoneFeatures: Array<{
    icon: string;
    title: string;
    desc: string;
  }>;

  // Social proof content
  socialTitle: string;
  stats: Array<{
    number: string;
    label: string;
  }>;

  // Testimonials content
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  testimonials: Array<{
    quote: string;
    author: string;
    title: string;
    location: string;
  }>;

  // Pricing content
  pricingTitle: string;
  pricingSubtitle: string;
  plans: Array<{
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    popular: boolean;
  }>;
}

const tabData: Record<UserType, TabContent> = {
  'sailors': {
    badge: 'Race Strategy Platform',
    title: 'Master Every Race with AI-Powered Strategy',
    subtitle: 'From tactical planning to real-time race execution',
    features: [
      { icon: 'cloud-outline', text: 'Weather Intelligence', color: '#3B82F6' },
      { icon: 'location-outline', text: 'Race Planning', color: '#10B981' },
      { icon: 'trophy', text: 'Performance Analytics', color: '#8B5CF6' },
    ],
    mapComponent: () => <SailorRaceStrategyMap />,
    ctaText: 'Start Racing Smarter',
    ctaSecondary: 'Watch Race Demo',

    phoneTitle: 'Professional racing tools designed by sailors',
    phoneSubtitle: 'Take the complete racing platform with you on the water',
    phoneFeatures: [
      { icon: '📄', title: 'Upload & Analyze', desc: 'Upload race data and get instant performance analysis with strategic recommendations.' },
      { icon: '🗺️', title: 'Map Your Course', desc: 'Digital course plotting with mark positioning, laylines, and strategic route optimization.' },
      { icon: '🌊', title: 'Weather Intelligence', desc: 'Comprehensive weather forecasting with wind patterns, tide data, and optimal racing conditions.' },
      { icon: '📊', title: 'Strategic Insights', desc: 'Advanced performance tracking with wind data, position analysis, and strategic insights during races.' },
      { icon: '⌚', title: 'Watch Companion', desc: 'Precision timing tools with countdown sequences, line bias detection, and optimal start positioning.' },
      { icon: '📱', title: 'Multi-Platform', desc: 'Crew communication tools with role assignments, strategy sharing, and synchronized race plans.' }
    ],

    socialTitle: 'Trusted by sailing champions worldwide',
    stats: [
      { number: '10,000+', label: 'Active Sailors' },
      { number: '500+', label: 'Yacht Clubs' },
      { number: '50+', label: 'Countries' }
    ],

    testimonialsTitle: 'Race-winning results from sailors around the world',
    testimonialsSubtitle: 'Hear from competitive sailors who\'ve transformed their racing with RegattaFlow',
    testimonials: [
      {
        quote: "RegattaFlow's AI strategy completely changed how I approach race planning. I went from mid-fleet to podium finishes consistently.",
        author: "Sarah Chen",
        title: "Dragon Class World Champion",
        location: "Hong Kong Yacht Club"
      },
      {
        quote: "The venue intelligence feature is incredible. When I sailed at Kiel Week for the first time, it felt like I had a local expert on board.",
        author: "Marcus Rodriguez",
        title: "Olympic Campaign Sailor",
        location: "Royal Spanish Sailing Federation"
      },
      {
        quote: "The weather intelligence and tactical recommendations helped me win my first regatta after years of trying. Game-changing technology.",
        author: "Emma Thompson",
        title: "Weekend Racing Sailor",
        location: "Royal Thames Yacht Club"
      }
    ],

    pricingTitle: 'Choose your competitive edge',
    pricingSubtitle: 'Pricing designed for competitive sailors',
    plans: [
      {
        name: "Free Sailor",
        price: "$0",
        period: "forever",
        description: "Perfect for weekend warriors",
        features: [
          "Basic race tracking",
          "5 documents per month",
          "Community support",
          "Mobile app access"
        ],
        cta: "Get Started Free",
        popular: false
      },
      {
        name: "Sailor Pro",
        price: "$29",
        period: "per month",
        description: "For competitive sailors",
        features: [
          "Unlimited race tracking",
          "AI strategy planning",
          "Global venue intelligence",
          "Advanced analytics",
          "Priority support",
          "Weather intelligence"
        ],
        cta: "Start 14-Day Trial",
        popular: true
      },
      {
        name: "Championship",
        price: "$49",
        period: "per month",
        description: "For racing professionals",
        features: [
          "Everything in Sailor Pro",
          "Coach marketplace access",
          "Team collaboration tools",
          "Custom race strategies",
          "1-on-1 strategy sessions",
          "Export race data"
        ],
        cta: "Go Professional",
        popular: false
      }
    ]
  },
  'yacht-clubs': {
    badge: 'Race Management Platform',
    title: 'Complete Regatta Management Suite',
    subtitle: 'From registration to results publication',
    features: [
      { icon: 'people', text: 'Event Management', color: '#3B82F6' },
      { icon: 'trophy', text: 'Live Scoring', color: '#10B981' },
      { icon: 'location-outline', text: 'Course Management', color: '#8B5CF6' },
    ],
    mapComponent: () => <YachtClubManagementMap />,
    ctaText: 'Manage Your Events',
    ctaSecondary: 'View Club Demo',

    phoneTitle: 'Complete regatta management in your pocket',
    phoneSubtitle: 'Run professional regattas from setup to results publication',
    phoneFeatures: [
      { icon: '📋', title: 'Entry Management', desc: 'Handle registrations, payments, and sailor communications all in one place.' },
      { icon: '🏁', title: 'Race Committee Tools', desc: 'Start sequences, timing systems, and real-time race management dashboard.' },
      { icon: '📊', title: 'Live Results', desc: 'Instant scoring and live leaderboards that update automatically during races.' },
      { icon: '📱', title: 'Mobile Race Control', desc: 'Full race committee functionality on mobile devices for on-water management.' },
      { icon: '🏆', title: 'Awards Ceremony', desc: 'Automated trophy calculations and professional results presentation.' },
      { icon: '📧', title: 'Communications', desc: 'Automated notifications and updates to competitors throughout the event.' }
    ],

    socialTitle: 'Powering regattas worldwide',
    stats: [
      { number: '500+', label: 'Yacht Clubs' },
      { number: '2,000+', label: 'Events Managed' },
      { number: '50,000+', label: 'Races Scored' }
    ],

    testimonialsTitle: 'Trusted by the world\'s leading yacht clubs',
    testimonialsSubtitle: 'See how yacht clubs are streamlining their regatta management',
    testimonials: [
      {
        quote: "Our yacht club runs 30+ regattas per year. RegattaFlow's race management tools cut our event setup time by 75%.",
        author: "Jennifer Walsh",
        title: "Race Committee Chair",
        location: "San Francisco Yacht Club"
      },
      {
        quote: "The automated scoring and live results feature transformed our regatta experience. Competitors love the real-time updates.",
        author: "Captain James Morrison",
        title: "Commodore",
        location: "Royal Sydney Yacht Squadron"
      },
      {
        quote: "RegattaFlow helped us go from paper-based management to a fully digital regatta in just one event. Incredible transformation.",
        author: "Maria Santos",
        title: "Regatta Director",
        location: "Club Náutico Barcelona"
      }
    ],

    pricingTitle: 'Professional regatta management',
    pricingSubtitle: 'Pricing designed for yacht clubs and sailing organizations',
    plans: [
      {
        name: "Club Starter",
        price: "$99",
        period: "per month",
        description: "Perfect for small yacht clubs",
        features: [
          "Up to 5 events per month",
          "Basic scoring system",
          "Entry management",
          "Results publication",
          "Email support"
        ],
        cta: "Start Free Trial",
        popular: false
      },
      {
        name: "Club Professional",
        price: "$299",
        period: "per month",
        description: "For active sailing clubs",
        features: [
          "Unlimited events",
          "Advanced scoring options",
          "Live race tracking",
          "Custom branding",
          "Priority support",
          "Mobile race committee app"
        ],
        cta: "Start Free Trial",
        popular: true
      },
      {
        name: "Enterprise",
        price: "$999",
        period: "per month",
        description: "For major sailing organizations",
        features: [
          "Everything in Professional",
          "Multiple venue management",
          "Advanced analytics",
          "API access",
          "Dedicated support",
          "Custom integrations"
        ],
        cta: "Contact Sales",
        popular: false
      }
    ]
  },
  'coaches': {
    badge: 'Coaching Platform',
    title: 'Professional Sailing Instruction Platform',
    subtitle: 'Performance analysis and student development',
    features: [
      { icon: 'medal', text: 'Performance Analysis', color: '#3B82F6' },
      { icon: 'people', text: 'Student Management', color: '#10B981' },
      { icon: 'trophy', text: 'Race Replay', color: '#8B5CF6' },
    ],
    mapComponent: () => <CoachRaceReplay />,
    ctaText: 'Start Coaching',
    ctaSecondary: 'Watch Coaching Demo',

    phoneTitle: 'Coaching tools that drive results',
    phoneSubtitle: 'Professional coaching platform for sailing instructors',
    phoneFeatures: [
      { icon: '🎯', title: 'Session Management', desc: 'Schedule, track, and manage all your coaching sessions with integrated calendar and payments.' },
      { icon: '📹', title: 'Video Analysis', desc: 'Review race footage with sailors, add annotations, and create detailed performance breakdowns.' },
      { icon: '📊', title: 'Progress Tracking', desc: 'Monitor sailor development with detailed analytics and performance metrics over time.' },
      { icon: '💬', title: 'Sailor Communication', desc: 'Stay connected with your sailors through integrated messaging and session notes.' },
      { icon: '💰', title: 'Payment Processing', desc: 'Automated invoicing and payment collection for all your coaching services.' },
      { icon: '🏆', title: 'Success Metrics', desc: 'Track your coaching effectiveness with sailor improvement statistics and success rates.' }
    ],

    socialTitle: 'Empowering sailing coaches globally',
    stats: [
      { number: '1,000+', label: 'Active Coaches' },
      { number: '5,000+', label: 'Sailors Coached' },
      { number: '25,000+', label: 'Sessions Completed' }
    ],

    testimonialsTitle: 'Coaches achieving breakthrough results',
    testimonialsSubtitle: 'See how professional coaches are growing their business with RegattaFlow',
    testimonials: [
      {
        quote: "RegattaFlow's coaching platform helped me triple my client base in 6 months. The scheduling and payment tools are game-changers.",
        author: "Coach Mike Stevens",
        title: "Olympic Sailing Coach",
        location: "US Sailing Team"
      },
      {
        quote: "The video analysis features let me provide much better feedback to my sailors. They're improving faster than ever before.",
        author: "Sarah Johnson",
        title: "Youth Sailing Coach",
        location: "Chicago Yacht Club"
      },
      {
        quote: "I can now coach sailors remotely around the world. The platform handles everything from booking to payment seamlessly.",
        author: "Captain Tom Wilson",
        title: "Professional Racing Coach",
        location: "Royal Ocean Racing Club"
      }
    ],

    pricingTitle: 'Grow your coaching business',
    pricingSubtitle: 'Pricing designed for sailing coaches and instructors',
    plans: [
      {
        name: "Coach Starter",
        price: "$39",
        period: "per month",
        description: "Perfect for new coaches",
        features: [
          "Up to 10 sessions per month",
          "Basic scheduling",
          "Payment processing",
          "Sailor progress tracking",
          "Email support"
        ],
        cta: "Start Free Trial",
        popular: false
      },
      {
        name: "Coach Professional",
        price: "$99",
        period: "per month",
        description: "For established coaches",
        features: [
          "Unlimited sessions",
          "Video analysis tools",
          "Advanced analytics",
          "Custom programs",
          "Priority support",
          "Mobile coaching app"
        ],
        cta: "Start Free Trial",
        popular: true
      },
      {
        name: "Coach Elite",
        price: "$199",
        period: "per month",
        description: "For coaching professionals",
        features: [
          "Everything in Professional",
          "Team coaching tools",
          "White-label platform",
          "API access",
          "Dedicated support",
          "Custom integrations"
        ],
        cta: "Contact Sales",
        popular: false
      }
    ]
  }
};

export function HeroTabs() {
  const [activeTab, setActiveTab] = useState<UserType>('sailors');
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();

  // Fix for React Native Web dimension issues - provide fallbacks
  const safeWidth = width || (Platform.OS === 'web' ? 1200 : 400);
  const safeHeight = height || (Platform.OS === 'web' ? 800 : 600);
  const isDesktop = safeWidth > 768;

  const currentTab = tabData[activeTab];

  const handleGetStarted = () => {
    if (user) {
      router.push('/(tabs)/dashboard');
    } else {
      router.push('/(auth)/signup');
    }
  };

  const handleDemo = () => {
    // TODO: Implement demo
    alert('Demo coming soon!');
  };

  return (
    <View style={styles.container}>
      {/* Marketing banner */}
      <LinearGradient
        colors={['#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.marketingBanner}
      >
        <Text style={styles.marketingText}>
          🏆 Join 10,000+ sailors using AI-powered race strategy • Free 14-day trial
        </Text>
      </LinearGradient>

      {/* Navigation Header */}
      <NavigationHeader />

      {/* Main content */}
      <View style={styles.content}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <View style={styles.tabNavigation}>
            {Object.entries(tabData).map(([key]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key as UserType)}
                style={[
                  styles.tabButton,
                  activeTab === key && styles.tabButtonActive
                ]}
              >
                <Text style={[
                  styles.tabButtonText,
                  activeTab === key && styles.tabButtonTextActive
                ]}>
                  {key === 'sailors' && 'For Sailors'}
                  {key === 'yacht-clubs' && 'For Yacht Clubs'}
                  {key === 'coaches' && 'For Coaches'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Grid */}
        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {/* Left column - Text content */}
          <View style={[styles.textContent, isDesktop && styles.textContentDesktop]}>
            {/* Badge */}
            <View style={styles.badge}>
              <Ionicons name="trophy" size={16} color="#3B82F6" style={styles.badgeIcon} />
              <Text style={styles.badgeText}>{currentTab.badge}</Text>
            </View>

            {/* Main heading */}
            <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
              {currentTab.title}
            </Text>

            <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>
              {currentTab.subtitle}
            </Text>

            {/* CTA Buttons */}
            <View style={[styles.ctaContainer, isDesktop && styles.ctaContainerDesktop]}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                <Text style={styles.primaryButtonText}>{currentTab.ctaText}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleDemo}>
                <Ionicons name="play" size={20} color="#3B82F6" style={styles.buttonIcon} />
                <Text style={styles.secondaryButtonText}>{currentTab.ctaSecondary}</Text>
              </TouchableOpacity>
            </View>

            {/* Feature highlights */}
            <View style={[styles.features, isDesktop && styles.featuresDesktop]}>
              {currentTab.features.map((feature, index) => (
                <View key={index} style={styles.feature}>
                  <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                    <Ionicons name={feature.icon} size={20} color={feature.color} />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right column - Interactive Map */}
          <View style={[styles.mapContainer, isDesktop && styles.mapContainerDesktop]}>
            {currentTab.mapComponent()}
          </View>
        </View>

        {/* Phone Section */}
        <View style={styles.phoneSection}>
          <View style={styles.phoneSectionContent}>
            <Text style={styles.phoneSectionTitle}>
              {currentTab.phoneTitle}
            </Text>
            <Text style={styles.phoneSectionSubtitle}>
              {currentTab.phoneSubtitle}
            </Text>

            <View style={[styles.phoneGrid, isDesktop && styles.phoneGridDesktop]}>
              {/* iPhone Mockup */}
              <View style={styles.phoneContainer}>
                <View style={styles.phoneFrame}>
                  {/* Screen */}
                  <View style={styles.phoneScreen}>
                    {/* Status bar */}
                    <View style={styles.statusBar}>
                      <View style={styles.statusLeft}>
                        <View style={styles.signalDot} />
                        <View style={styles.signalDot} />
                        <View style={styles.signalDot} />
                        <Text style={styles.appName}>RegattaFlow</Text>
                      </View>
                      <View style={styles.statusRight}>
                        <Text style={styles.batteryText}>100%</Text>
                        <View style={styles.batteryIcon}>
                          <View style={styles.batteryFill} />
                        </View>
                      </View>
                    </View>

                    {/* App Content */}
                    <View style={styles.appContent}>
                      {/* Header with tabs */}
                      <View style={styles.appHeader}>
                        <View style={styles.tabRow}>
                          <View style={styles.tabItem}>
                            <View style={[styles.tabIcon, styles.tabIconActive]}>
                              <Ionicons name="boat-outline" size={16} color="#FFFFFF" />
                            </View>
                            <Text style={styles.tabLabelActive}>Race</Text>
                          </View>
                          <View style={styles.tabItem}>
                            <View style={styles.tabIcon}>
                              <Ionicons name="trophy" size={16} color="#6B7280" />
                            </View>
                            <Text style={styles.tabLabel}>Fleet</Text>
                          </View>
                        </View>
                      </View>

                      {/* Nautical Map */}
                      <View style={styles.mapContainer}>
                        <View style={styles.mapBackground}>
                          {/* Compass lines */}
                          <View style={styles.compassLines} />
                        </View>

                        {/* Floating data cards */}
                        <View style={[styles.dataCard, {position: 'absolute', top: 16, left: 8}]}>
                          <Text style={styles.dataCardLabel}>Tide</Text>
                          <Text style={styles.dataCardValue}>1.2kt →</Text>
                          <Text style={styles.dataCardSub}>Flood +2hrs</Text>
                        </View>

                        <View style={[styles.dataCard, {position: 'absolute', top: 16, right: 8}]}>
                          <View style={styles.windIndicator}>
                            <View style={styles.windDot} />
                            <Text style={styles.dataCardLabel}>Wind</Text>
                          </View>
                          <Text style={styles.dataCardValue}>14kt</Text>
                          <Text style={styles.dataCardSubGreen}>+5° Right Shift</Text>
                        </View>

                        {/* Course markers */}
                        <View style={[styles.courseMarker, {position: 'absolute', bottom: 32, alignSelf: 'center'}]}>
                          <View style={styles.markerDotRed} />
                          <Text style={styles.markerText}>Start Line</Text>
                        </View>

                        <View style={[styles.courseMarker, {position: 'absolute', top: 48, alignSelf: 'center'}]}>
                          <View style={styles.markerDotYellow} />
                          <Text style={styles.markerText}>Mark 1</Text>
                        </View>
                      </View>

                      {/* Race Strategy Card */}
                      <View style={styles.strategyCard}>
                        <View style={styles.strategyHeader}>
                          <Ionicons name="trophy" size={20} color="#10B981" />
                          <Text style={styles.strategyTitle}>Race Strategy</Text>
                        </View>
                        <View style={styles.strategyStats}>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Position</Text>
                            <Text style={styles.statValueGreen}>3rd / 24</Text>
                          </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Time to Start</Text>
                            <Text style={styles.statValueRed}>02:45</Text>
                          </View>
                          <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Course</Text>
                            <Text style={styles.statValue}>Windward/Leeward</Text>
                          </View>
                        </View>
                      </View>

                      {/* Quick Actions */}
                      <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.primaryAction}>
                          <Text style={styles.primaryActionText}>Start Timer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryAction}>
                          <Text style={styles.secondaryActionText}>Mark Position</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Navigation dots */}
                      <View style={styles.navDots}>
                        <View style={[styles.navDot, styles.navDotActive]} />
                        <View style={styles.navDot} />
                        <View style={styles.navDot} />
                      </View>
                    </View>
                  </View>

                  {/* Home indicator */}
                  <View style={styles.homeIndicator} />
                </View>
              </View>

              {/* Features List */}
              <View style={styles.featuresListContainer}>
                {currentTab.phoneFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureListItem}>
                    <Text style={styles.featureListIcon}>{feature.icon}</Text>
                    <View style={styles.featureListContent}>
                      <Text style={styles.featureListTitle}>{feature.title}</Text>
                      <Text style={styles.featureListDesc}>{feature.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Social Proof Section */}
        <View style={styles.socialProofSection}>
          <View style={styles.socialProofContent}>
            <Text style={styles.socialProofTitle}>
              {currentTab.socialTitle}
            </Text>
            <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
              {currentTab.stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <Text style={styles.statNumber}>{stat.number}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={styles.testimonialsSection}>
          <View style={styles.testimonialsSectionContent}>
            <Text style={styles.testimonialsSectionTitle}>
              {currentTab.testimonialsTitle}
            </Text>
            <Text style={styles.testimonialsSectionSubtitle}>
              {currentTab.testimonialsSubtitle}
            </Text>

            <View style={[styles.testimonialsGrid, isDesktop && styles.testimonialsGridDesktop]}>
              {currentTab.testimonials.map((testimonial, index) => (
                <View key={index} style={styles.testimonialCard}>
                  <View style={styles.testimonialQuote}>
                    <Ionicons name="chatbox-outline" size={24} color="#3B82F6" style={styles.quoteIcon} />
                    <Text style={styles.testimonialText}>"{testimonial.quote}"</Text>
                  </View>
                  <View style={styles.testimonialAuthor}>
                    <Text style={styles.authorName}>{testimonial.author}</Text>
                    <Text style={styles.authorTitle}>{testimonial.title}</Text>
                    <Text style={styles.authorLocation}>{testimonial.location}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.pricingSectionContent}>
            <Text style={styles.pricingSectionTitle}>
              {currentTab.pricingTitle}
            </Text>
            <Text style={styles.pricingSectionSubtitle}>
              {currentTab.pricingSubtitle}
            </Text>

            <View style={[styles.pricingGrid, isDesktop && styles.pricingGridDesktop]}>
              {currentTab.plans.map((plan, index) => (
                <View key={index} style={[styles.pricingCard, plan.popular && styles.pricingCardPopular]}>
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Most Popular</Text>
                    </View>
                  )}
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                  </View>
                  <Text style={styles.planDescription}>{plan.description}</Text>

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, featureIndex) => (
                      <View key={featureIndex} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.featureItemText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity style={[styles.planButton, plan.popular && styles.planButtonPopular]} onPress={handleGetStarted}>
                    <Text style={[styles.planButtonText, plan.popular && styles.planButtonTextPopular]}>{plan.cta}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Final CTA Section */}
        <View style={styles.finalCtaSection}>
          <LinearGradient
            colors={['#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finalCtaGradient}
          >
            <View style={styles.finalCtaContent}>
              <Text style={styles.finalCtaTitle}>
                Ready to transform your sailing?
              </Text>
              <Text style={styles.finalCtaSubtitle}>
                Join thousands of sailors already using RegattaFlow to race smarter and faster.
              </Text>
              <View style={[styles.finalCtaButtons, isDesktop && styles.finalCtaButtonsDesktop]}>
                <TouchableOpacity style={styles.finalCtaPrimary} onPress={handleGetStarted}>
                  <Text style={styles.finalCtaPrimaryText}>Start Free Trial</Text>
                  <Ionicons name="arrow-forward" size={20} color="#3B82F6" style={styles.buttonIcon} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.finalCtaSecondary} onPress={handleDemo}>
                  <Ionicons name="play" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.finalCtaSecondaryText}>Watch Demo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            {/* Footer Grid */}
            <View style={[styles.footerGrid, isDesktop && styles.footerGridDesktop]}>
              {/* Brand Column */}
              <View style={styles.footerBrand}>
                <View style={styles.footerLogo}>
                  <Ionicons name="boat-outline" size={32} color="#3B82F6" />
                  <Text style={styles.footerLogoText}>RegattaFlow</Text>
                </View>
                <Text style={styles.footerDescription}>
                  The complete sailing ecosystem for competitive sailors, yacht clubs, and coaches worldwide.
                </Text>
                <View style={styles.socialLinks}>
                  <TouchableOpacity style={styles.socialLink}>
                    <Ionicons name="logo-twitter" size={24} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialLink}>
                    <Ionicons name="logo-linkedin" size={24} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialLink}>
                    <Ionicons name="logo-instagram" size={24} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialLink}>
                    <Ionicons name="logo-youtube" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Product Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Product</Text>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>For Sailors</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>For Yacht Clubs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>For Coaches</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Pricing</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>API</Text>
                </TouchableOpacity>
              </View>

              {/* Resources Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Resources</Text>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Help Center</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Blog</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Guides</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Community</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Status</Text>
                </TouchableOpacity>
              </View>

              {/* Company Column */}
              <View style={styles.footerColumn}>
                <Text style={styles.footerColumnTitle}>Company</Text>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>About</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Careers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Press</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Partners</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerLink}>
                  <Text style={styles.footerLinkText}>Contact</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Bottom */}
            <View style={styles.footerBottom}>
              <View style={[styles.footerBottomContent, isDesktop && styles.footerBottomContentDesktop]}>
                <Text style={styles.copyright}>
                  © 2024 RegattaFlow. All rights reserved.
                </Text>
                <View style={[styles.legalLinks, isDesktop && styles.legalLinksDesktop]}>
                  <TouchableOpacity>
                    <Text style={styles.legalLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.legalLink}>Terms of Service</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.legalLink}>Cookie Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    width: '100%',
    ...Platform.select({
      web: {
        minHeight: '100vh',
        height: 'auto',
      },
      default: {
        flex: 1,
      },
    }),
  },
  marketingBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  marketingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 64,
    ...Platform.select({
      web: {
        minHeight: 'calc(100vh - 120px)', // Account for header height
      },
      default: {
        flex: 1,
      },
    }),
  },
  tabContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }
      : {
          boxShadow: '0px 2px',
          elevation: 4,
        }
    ),
  },
  tabButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: '#3B82F6',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' }
      : {
          boxShadow: '0px 2px',
          elevation: 3,
        }
    ),
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    gap: 48,
  },
  gridDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  textContent: {
    alignItems: 'center',
  },
  textContentDesktop: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 48,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F620',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3B82F640',
    marginBottom: 32,
  },
  badgeIcon: {
    marginRight: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 24,
    lineHeight: 40,
  },
  titleDesktop: {
    fontSize: 48,
    textAlign: 'left',
    lineHeight: 56,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 28,
  },
  subtitleDesktop: {
    fontSize: 20,
    textAlign: 'left',
    lineHeight: 32,
  },
  ctaContainer: {
    gap: 16,
    marginBottom: 48,
    width: '100%',
  },
  ctaContainerDesktop: {
    flexDirection: 'row',
    width: 'auto',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)' }
      : {
          boxShadow: '0px 4px',
          elevation: 4,
        }
    ),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }
      : {
          boxShadow: '0px 2px',
          elevation: 2,
        }
    ),
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  features: {
    gap: 24,
    width: '100%',
  },
  featuresDesktop: {
    flexDirection: 'row',
    gap: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  mapContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    minHeight: 400,
    ...Platform.select({
      web: {
        height: 400,
      },
      default: {
        height: 400,
      },
    }),
  },
  mapContainerDesktop: {
    flex: 1,
    maxWidth: 600,
    minHeight: 400,
    ...Platform.select({
      web: {
        height: 400,
      },
      default: {
        height: 400,
      },
    }),
  },
  phoneSection: {
    paddingVertical: 80,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  phoneSectionContent: {
    maxWidth: 800,
    alignItems: 'center',
  },
  phoneSectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  phoneSectionSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  phoneMockup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFrame: {
    width: 200,
    height: 400,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  phoneFeatures: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'left',
  },
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  featuresSectionContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    alignItems: 'center',
  },
  featuresSectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresSectionSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  featuresGrid: {
    gap: 32,
    width: '100%',
  },
  featuresGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? {
          width: '100%',
          maxWidth: 350,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }
      : {
          boxShadow: '0px 2px',
          elevation: 4,
        }
    ),
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  featureCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureCardDesc: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  socialProofSection: {
    paddingVertical: 80,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  socialProofContent: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  socialProofTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 48,
  },
  statsGrid: {
    gap: 32,
    width: '100%',
  },
  statsGridDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Testimonials Section Styles
  testimonialsSection: {
    paddingVertical: 80,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
  },
  testimonialsSectionContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    alignItems: 'center',
  },
  testimonialsSectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  testimonialsSectionSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  testimonialsGrid: {
    gap: 32,
    width: '100%',
  },
  testimonialsGridDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 16,
    ...(Platform.OS === 'web'
      ? {
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }
      : {
          boxShadow: '0px 4px',
          elevation: 6,
        }
    ),
  },
  testimonialQuote: {
    marginBottom: 24,
  },
  quoteIcon: {
    marginBottom: 16,
  },
  testimonialText: {
    fontSize: 18,
    color: '#1F2937',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    alignItems: 'flex-start',
  },
  authorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  authorTitle: {
    fontSize: 16,
    color: '#3B82F6',
    marginBottom: 4,
  },
  authorLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Pricing Section Styles
  pricingSection: {
    paddingVertical: 80,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  pricingSectionContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    alignItems: 'center',
  },
  pricingSectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  pricingSectionSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  pricingGrid: {
    gap: 32,
    width: '100%',
  },
  pricingGridDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pricingCard: {
    backgroundColor: '#F8FAFC',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          width: '100%',
          maxWidth: 350,
        }
      : {}
    ),
  },
  pricingCardPopular: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
    borderWidth: 2,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)' }
      : {
          boxShadow: '0px 4px',
          elevation: 6,
        }
    ),
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  planPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureItemText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  planButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  planButtonPopular: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  planButtonTextPopular: {
    color: '#FFFFFF',
  },
  // Phone Section Styles
  phoneGrid: {
    gap: 48,
    width: '100%',
  },
  phoneGridDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 320,
      },
    }),
  },
  phoneFrame: {
    width: 320,
    height: 640,
    backgroundColor: '#1F2937',
    borderRadius: 48,
    padding: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25)' }
      : {
          boxShadow: '0px 8px',
          elevation: 8,
        }
    ),
  },
  phoneScreen: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalDot: {
    width: 4,
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginRight: 4,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 8,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginRight: 4,
  },
  batteryIcon: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 2,
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  batteryFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  appContent: {
    flex: 1,
    padding: 16,
    backgroundColor: '#EBF8FF',
  },
  appHeader: {
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabIconActive: {
    backgroundColor: '#3B82F6',
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabLabelActive: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  mapContainer: {
    position: 'relative',
    backgroundColor: '#EBF8FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    minHeight: 200,
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  compassLines: {
    width: '100%',
    height: '100%',
    // This would be replaced with actual SVG compass rose in a real implementation
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    minWidth: 80,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }
      : {
          boxShadow: '0px 1px',
          elevation: 2,
        }
    ),
  },
  dataCardLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  dataCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 2,
  },
  dataCardSub: {
    fontSize: 10,
    color: '#3B82F6',
    textAlign: 'center',
  },
  dataCardSubGreen: {
    fontSize: 10,
    color: '#10B981',
    textAlign: 'center',
  },
  windIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  windDot: {
    width: 12,
    height: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    marginRight: 4,
  },
  courseMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markerDotRed: {
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    marginRight: 8,
  },
  markerDotYellow: {
    width: 8,
    height: 8,
    backgroundColor: '#EAB308',
    borderRadius: 4,
    marginRight: 8,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  strategyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }
      : {
          boxShadow: '0px 1px',
          elevation: 2,
        }
    ),
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  strategyStats: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statValueGreen: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  statValueRed: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  navDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  navDot: {
    width: 8,
    height: 8,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
  },
  navDotActive: {
    backgroundColor: '#3B82F6',
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -64,
    width: 128,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  featuresListContainer: {
    flex: 1,
    gap: 24,
    ...Platform.select({
      web: {
        maxWidth: 600,
      },
    }),
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  featureListIcon: {
    fontSize: 24,
  },
  featureListContent: {
    flex: 1,
  },
  featureListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureListDesc: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  // Final CTA Section
  finalCtaSection: {
    marginTop: 80,
  },
  finalCtaGradient: {
    paddingVertical: 80,
    paddingHorizontal: 16,
  },
  finalCtaContent: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  finalCtaTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  finalCtaSubtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
  },
  finalCtaButtons: {
    gap: 16,
    width: '100%',
    alignItems: 'center',
  },
  finalCtaButtonsDesktop: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  finalCtaPrimary: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)' }
      : {
          boxShadow: '0px 4px',
          elevation: 6,
        }
    ),
  },
  finalCtaPrimaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },
  finalCtaSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  finalCtaSecondaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Footer
  footer: {
    backgroundColor: '#1F2937',
    paddingVertical: 64,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  footerGrid: {
    gap: 48,
    marginBottom: 48,
  },
  footerGridDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerBrand: {
    flex: 2,
    marginRight: 48,
  },
  footerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginLeft: 12,
  },
  footerDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    marginBottom: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 16,
  },
  socialLink: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerColumn: {
    flex: 1,
    minWidth: 150,
  },
  footerColumnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 20,
  },
  footerLink: {
    marginBottom: 12,
  },
  footerLinkText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  footerBottom: {
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  footerBottomContent: {
    gap: 24,
    alignItems: 'center',
  },
  footerBottomContentDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyright: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  legalLinks: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  legalLinksDesktop: {
    flexDirection: 'row',
    gap: 24,
  },
  legalLink: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});