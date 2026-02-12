import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type LandingTab = 'race' | 'follow' | 'discuss' | 'learn' | 'reflect';

const TABS: Array<{ key: LandingTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'race', label: 'Race', icon: 'flag-outline' },
  { key: 'follow', label: 'Follow', icon: 'people-outline' },
  { key: 'discuss', label: 'Discuss', icon: 'chatbubble-outline' },
  { key: 'learn', label: 'Learn', icon: 'book-outline' },
  { key: 'reflect', label: 'Reflect', icon: 'stats-chart-outline' },
];

interface PreviewProps {
  activeTab?: LandingTab;
  onTabChange?: (tab: LandingTab) => void;
  compact?: boolean;
}

const IPHONE_FRAME_ASSET = require('@/assets/landing/iphone-frame.png');

const CONTENT: Record<
  LandingTab,
  {
    header: string;
    subtitle: string;
    chips: string[];
    cards: Array<{ title: string; meta: string; stat?: string; accent?: string }>;
  }
> = {
  race: {
    header: 'Race',
    subtitle: '22 of 29 | 8 upcoming',
    chips: ['Prep', 'Race', 'Review'],
    cards: [
      {
        title: 'Commodore Series Races 5 & 6',
        meta: 'Port Shelter • Wednesday, Feb 11',
        stat: '+2 since start',
        accent: '#1D4ED8',
      },
      {
        title: 'Pre-Departure Checks',
        meta: 'Sails selected • Rig tune complete',
        stat: '2/2 ready',
      },
      {
        title: 'Race Review',
        meta: 'AI insights and race summary',
        stat: '3rd of 4',
      },
    ],
  },
  follow: {
    header: 'Follow',
    subtitle: 'Fleet updates from your circles',
    chips: ['Posts', 'Following'],
    cards: [
      { title: 'RHKYC Dragon Winter Series', meta: 'Fleet • Raced today', stat: 'Results posted' },
      { title: 'Unknown Fleet Log', meta: 'Comment + tactical note', stat: 'New discussion' },
      { title: 'Commodore Series Recap', meta: 'Highlights + crew notes', stat: '4 comments' },
    ],
  },
  discuss: {
    header: 'Discuss',
    subtitle: 'Community signals around the world',
    chips: ['Hot', 'New', 'Rising', 'Top'],
    cards: [
      {
        title: 'Current patterns near Green Island',
        meta: 'Tactics • Currents • Local knowledge',
        stat: '24 upvotes',
        accent: '#0EA5E9',
      },
      {
        title: 'Post-race conditions report',
        meta: 'Weather • Wind shifts • Wednesday series',
        stat: '31 upvotes',
      },
      { title: 'Safety: barge near bridge', meta: 'Heads up for race committee boats', stat: '245 views' },
    ],
  },
  learn: {
    header: 'Learn',
    subtitle: '2 of 14 courses started • 1 completed',
    chips: ['All', 'Fundamentals', 'Intermediate', 'Advanced'],
    cards: [
      { title: 'Winning Starts & First Beats', meta: 'Fleet positioning strategy', stat: '65% complete' },
      { title: 'Racing Basics', meta: '120 min • 5 modules', stat: 'Free' },
      { title: 'Boat Handling Fundamentals', meta: '180 min • 3 modules', stat: 'Coming Soon' },
    ],
  },
  reflect: {
    header: 'Reflect',
    subtitle: 'Track your race log and progress',
    chips: ['Progress', 'Race Log', 'Profile'],
    cards: [
      { title: 'This Week', meta: 'Race + training activity timeline', stat: '3 sessions' },
      { title: 'Monthly Activities', meta: '4 races • 0 podiums', stat: 'See full stats' },
      { title: 'Performance Trend', meta: 'Avg finish by venue and wind band', stat: 'Insights ready' },
    ],
  },
};

export function LandingIosAppPreview({ activeTab = 'race', onTabChange, compact = false }: PreviewProps) {
  if (Platform.OS === 'web' && !compact) {
    return <ScreenshotPhonePreview activeTab={activeTab} onTabChange={onTabChange} />;
  }

  const screen = CONTENT[activeTab];
  const tabBarHeight = compact ? 58 : 66;
  const horizontalPad = compact ? 10 : 14;

  return (
    <View style={styles.phoneShell}>
      <View style={styles.phoneBezel}>
        <View style={styles.screen}>
          <View style={[styles.statusBar, compact && styles.statusBarCompact]}>
            <Text style={[styles.time, compact && styles.timeCompact]}>2:32</Text>
            <View style={styles.notch} />
            <View style={styles.statusIcons}>
              <Ionicons name="cellular-outline" size={compact ? 12 : 14} color="#111827" />
              <Ionicons name="wifi-outline" size={compact ? 12 : 14} color="#111827" />
              <Ionicons name="battery-half-outline" size={compact ? 12 : 14} color="#111827" />
            </View>
          </View>

          <View style={[styles.header, { paddingHorizontal: horizontalPad }]}>
            <Text style={[styles.headerTitle, compact && styles.headerTitleCompact]}>{screen.header}</Text>
            <Text style={[styles.headerMeta, compact && styles.headerMetaCompact]}>{screen.subtitle}</Text>
          </View>

          <View style={[styles.chipsRow, { paddingHorizontal: horizontalPad }]}>
            {screen.chips.map((chip, index) => (
              <View
                key={chip}
                style={[
                  styles.chip,
                  index === 0 && styles.chipActive,
                  compact && styles.chipCompact,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    index === 0 && styles.chipTextActive,
                    compact && styles.chipTextCompact,
                  ]}
                >
                  {chip}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView
            style={styles.cardsScroll}
            contentContainerStyle={[styles.cardsContent, { paddingHorizontal: horizontalPad, paddingBottom: tabBarHeight + 10 }]}
            showsVerticalScrollIndicator={false}
          >
            {screen.cards.map((card) => (
              <View key={card.title} style={styles.card}>
                <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]} numberOfLines={2}>
                  {card.title}
                </Text>
                <Text style={[styles.cardMeta, compact && styles.cardMetaCompact]} numberOfLines={2}>
                  {card.meta}
                </Text>
                {card.stat ? (
                  <Text style={[styles.cardStat, card.accent ? { color: card.accent } : null]}>{card.stat}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.bottomBar, { height: tabBarHeight }]}>
            {TABS.map((tab) => {
              const selected = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabButton}
                  onPress={() => onTabChange?.(tab.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tab.icon}
                    size={compact ? 16 : 18}
                    color={selected ? '#2563EB' : '#9CA3AF'}
                  />
                  <Text style={[styles.tabText, selected && styles.tabTextActive, compact && styles.tabTextCompact]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

function ScreenshotPhonePreview({
  activeTab,
  onTabChange,
}: {
  activeTab: LandingTab;
  onTabChange?: (tab: LandingTab) => void;
}) {
  return (
    <View style={styles.iphonePerspective}>
      <View style={styles.iphoneShadowLayer} />
      <View style={styles.iphoneRimGlow} />
      <View style={styles.iphoneOuter}>
      <View style={styles.iphoneFrame}>
        <View style={styles.dynamicIsland} />
        <View style={styles.sideButtonTop} />
        <View style={styles.sideButtonBottom} />
        <View style={styles.sideButtonRight} />
        <View style={styles.realScreen}>
          <TabReplica activeTab={activeTab} />

          <View style={styles.bottomBar}>
            {TABS.map((tab) => {
              const selected = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabButton}
                  onPress={() => onTabChange?.(tab.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={tab.icon} size={18} color={selected ? '#2563EB' : '#9CA3AF'} />
                  <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <Image source={IPHONE_FRAME_ASSET} style={styles.frameOverlay} resizeMode="stretch" />
      </View>
      </View>
    </View>
  );
}

function TabReplica({ activeTab }: { activeTab: LandingTab }) {
  if (activeTab === 'race') return <RaceScreenReplica />;
  if (activeTab === 'follow') return <FollowScreenReplica />;
  if (activeTab === 'discuss') return <DiscussScreenReplica />;
  if (activeTab === 'learn') return <LearnScreenReplica />;
  return <ReflectScreenReplica />;
}

function RaceScreenReplica() {
  return (
    <View style={styles.replicaRoot}>
      <View style={styles.replicaStatus}>
        <Text style={styles.replicaTime}>3:28</Text>
      </View>

      <View style={styles.replicaHeaderRow}>
        <Text style={styles.replicaTitle}>Race</Text>
        <Text style={styles.replicaCount}>23 of 29 | 8 upcoming</Text>
      </View>
      <View style={styles.replicaSeasonRow}>
        <Text style={styles.replicaSeason}>Winter 2025-2026</Text>
        <Text style={styles.replicaPage}>1 of 1</Text>
      </View>

      <View style={styles.replicaCard}>
        <View style={styles.replicaBadgeRow}>
          <View style={styles.replicaFleetBadge}>
            <Text style={styles.replicaFleetText}>FLEET</Text>
          </View>
          <View style={styles.replicaDaysWrap}>
            <Text style={styles.replicaDays}>23</Text>
            <Text style={styles.replicaDaysLabel}>days</Text>
          </View>
        </View>

        <Text style={styles.replicaRaceName}>Moonraker Series Races 1 & 2</Text>
        <Text style={styles.replicaMeta}>Port Shelter</Text>
        <Text style={styles.replicaMeta}>Saturday, Mar 7 at 11:00 AM</Text>

        <View style={styles.replicaSegment}>
          <View style={[styles.replicaSegmentBtn, styles.replicaSegmentBtnActive]}>
            <Text style={[styles.replicaSegmentText, styles.replicaSegmentTextActive]}>Prep</Text>
          </View>
          <View style={styles.replicaSegmentBtn}>
            <Text style={styles.replicaSegmentText}>Race</Text>
          </View>
          <View style={styles.replicaSegmentBtn}>
            <Text style={styles.replicaSegmentText}>Review</Text>
          </View>
        </View>

        <Text style={styles.replicaSectionTitle}>RACE INTEL</Text>
        <Text style={styles.replicaSectionSub}>Documents and weather forecast</Text>
        <View style={styles.replicaTileRow}>
          <View style={styles.replicaTile}>
            <Text style={styles.replicaTileLabel}>BRIEFING</Text>
            <Text style={styles.replicaTileMain}>Race Briefing</Text>
            <Text style={styles.replicaTileAction}>Start briefing</Text>
          </View>
          <View style={styles.replicaTile}>
            <Text style={styles.replicaTileLabel}>WEATHER</Text>
            <Text style={styles.replicaTileMain}>Check forecast</Text>
            <Text style={styles.replicaTileAction}>Check forecast</Text>
          </View>
        </View>

        <Text style={styles.replicaSectionTitle}>EQUIPMENT</Text>
        <Text style={styles.replicaSectionSub}>Sails, rigging, electronics, and safety</Text>
        <View style={styles.replicaTileRow}>
          <View style={styles.replicaTile}>
            <Text style={styles.replicaTileLabel}>SAILS</Text>
            <Text style={styles.replicaTileMain}>Class TBD</Text>
            <Text style={styles.replicaTileAction}>Select sails</Text>
          </View>
          <View style={styles.replicaTile}>
            <Text style={styles.replicaTileLabel}>RIG</Text>
            <Text style={styles.replicaTileMain}>Inspect & tune</Text>
            <Text style={styles.replicaTileAction}>Tune rig</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function FollowScreenReplica() {
  return (
    <View style={styles.replicaRoot}>
      <View style={styles.replicaStatus}><Text style={styles.replicaTime}>2:32</Text></View>
      <Text style={styles.replicaTitle}>Follow</Text>
      <View style={styles.replicaTabRow}>
        <Text style={[styles.replicaTabPill, styles.replicaTabPillActive]}>Posts</Text>
        <Text style={styles.replicaTabPill}>Following</Text>
      </View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>RHKYC Dragon Winter Series - Race 4</Text><Text style={styles.feedMeta}>Fleet • Raced Feb 2 • Results</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Commodore Series Races 5 & 6</Text><Text style={styles.feedMeta}>Fleet • Raced today • Comments</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Unknown Fleet Log</Text><Text style={styles.feedMeta}>Racing • Tactical suggestion</Text></View>
    </View>
  );
}

function DiscussScreenReplica() {
  return (
    <View style={styles.replicaRoot}>
      <View style={styles.replicaStatus}><Text style={styles.replicaTime}>2:32</Text></View>
      <Text style={styles.replicaTitle}>Community</Text>
      <View style={styles.replicaTabRow}>
        <Text style={[styles.replicaTabPill, styles.replicaTabPillActive]}>Feed</Text>
        <Text style={styles.replicaTabPill}>Communities</Text>
      </View>
      <View style={styles.chipRow}><Text style={[styles.topicChip, styles.topicChipHot]}>Hot</Text><Text style={styles.topicChip}>New</Text><Text style={styles.topicChip}>Rising</Text><Text style={styles.topicChip}>Top</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Current patterns near Green Island</Text><Text style={styles.feedMeta}>Currents • Tactics • 317 views</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Post-race conditions report</Text><Text style={styles.feedMeta}>Weather • Wind shifts • 245 views</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Safety: barge near Stonecutters</Text><Text style={styles.feedMeta}>Safety • Harbor notice</Text></View>
    </View>
  );
}

function LearnScreenReplica() {
  return (
    <View style={styles.replicaRoot}>
      <View style={styles.replicaStatus}><Text style={styles.replicaTime}>2:32</Text></View>
      <Text style={styles.replicaTitle}>Learn</Text>
      <View style={styles.replicaTabRow}>
        <Text style={[styles.replicaTabPill, styles.replicaTabPillActive]}>Courses</Text>
        <Text style={styles.replicaTabPill}>Coaches</Text>
      </View>
      <View style={styles.learnHero}><Text style={styles.learnPct}>65%</Text><Text style={styles.learnCourse}>Winning Starts & First Beats</Text><Text style={styles.learnAction}>Continue</Text></View>
      <Text style={styles.learnMeta}>2 of 14 courses started • 1 completed</Text>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Racing Basics</Text><Text style={styles.feedMeta}>120 min • 5 modules • Free</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Boat Handling Fundamentals</Text><Text style={styles.feedMeta}>180 min • 3 modules • Coming Soon</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Wind Shift Tactics</Text><Text style={styles.feedMeta}>180 min • 3 modules • Coming Soon</Text></View>
    </View>
  );
}

function ReflectScreenReplica() {
  return (
    <View style={styles.replicaRoot}>
      <View style={styles.replicaStatus}><Text style={styles.replicaTime}>2:32</Text></View>
      <Text style={styles.replicaTitle}>Reflect</Text>
      <View style={styles.replicaTabRow}>
        <Text style={[styles.replicaTabPill, styles.replicaTabPillActive]}>Progress</Text>
        <Text style={styles.replicaTabPill}>Race Log</Text>
        <Text style={styles.replicaTabPill}>Profile</Text>
      </View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>This Week</Text><Text style={styles.feedMeta}>Race + training activity timeline</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Monthly Activities</Text><Text style={styles.feedMeta}>4 races • 0 podiums • -481m on water</Text></View>
      <View style={styles.feedCard}><Text style={styles.feedTitle}>Performance</Text><Text style={styles.feedMeta}>Average finish position over time</Text></View>
    </View>
  );
}

interface ScreensSectionProps {
  selectedTab: LandingTab;
  onSelectTab: (tab: LandingTab) => void;
}

export function LandingScreensSection({ selectedTab, onSelectTab }: ScreensSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>All Core Screens</Text>
      <Text style={styles.sectionSubtitle}>
        Race planning, fleet follow, community discuss, learn modules, and post-race reflection.
      </Text>
      <View style={styles.screenGrid}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.screenCard, selectedTab === tab.key && styles.screenCardActive]}
            activeOpacity={0.9}
            onPress={() => onSelectTab(tab.key)}
          >
            <Text style={styles.screenCardTitle}>{tab.label}</Text>
            <View style={styles.miniPhoneWrap}>
              <LandingIosAppPreview activeTab={tab.key} compact />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  phoneShell: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  phoneBezel: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#0F172A',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  screen: {
    flex: 1,
    backgroundColor: '#F4F5FB',
  },
  realScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    borderRadius: 34,
    overflow: 'hidden',
  },
  realImage: {
    width: '100%',
    height: '100%',
  },
  frameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 8,
  },
  replicaRoot: {
    flex: 1,
    backgroundColor: '#F3F4FA',
    paddingHorizontal: 14,
    paddingBottom: 88,
  },
  replicaStatus: {
    height: 28,
    justifyContent: 'center',
  },
  replicaTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  replicaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  replicaTitle: {
    fontSize: 58 / 2,
    fontWeight: '800',
    color: '#0F172A',
  },
  replicaCount: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
  },
  replicaSeasonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  replicaSeason: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  replicaPage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  replicaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 12,
    gap: 7,
  },
  replicaBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replicaFleetBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  replicaFleetText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#6B7280',
  },
  replicaDaysWrap: {
    alignItems: 'center',
  },
  replicaDays: {
    fontSize: 28,
    color: '#22C55E',
    fontWeight: '800',
    lineHeight: 30,
  },
  replicaDaysLabel: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '600',
  },
  replicaRaceName: {
    fontSize: 22 / 1.45,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  replicaMeta: {
    fontSize: 13,
    color: '#4B5563',
  },
  replicaSegment: {
    marginTop: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 3,
    flexDirection: 'row',
    gap: 4,
  },
  replicaSegmentBtn: {
    flex: 1,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  replicaSegmentBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  replicaSegmentText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  replicaSegmentTextActive: {
    color: '#111827',
  },
  replicaSectionTitle: {
    marginTop: 6,
    fontSize: 18 / 1.35,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 0.8,
  },
  replicaSectionSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: -2,
    marginBottom: 4,
  },
  replicaTileRow: {
    flexDirection: 'row',
    gap: 8,
  },
  replicaTile: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 10,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  replicaTileLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  replicaTileMain: {
    fontSize: 16 / 1.4,
    fontWeight: '700',
    color: '#374151',
  },
  replicaTileAction: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700',
  },
  replicaTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  replicaTabPill: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  replicaTabPillActive: {
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  feedMeta: {
    marginTop: 4,
    fontSize: 11,
    color: '#6B7280',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  topicChip: {
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    fontWeight: '700',
  },
  topicChipHot: {
    color: '#FFFFFF',
    backgroundColor: '#111827',
  },
  learnHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    marginBottom: 8,
  },
  learnPct: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  learnCourse: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  learnAction: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  learnMeta: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  iphoneOuter: {
    flex: 1,
    backgroundColor: '#07183D',
    padding: 8,
    borderRadius: 38,
    ...Platform.select({
      web: {
        transform: 'perspective(1200px) rotateX(4deg) rotateY(-5deg)',
      } as any,
    }),
  },
  iphoneFrame: {
    flex: 1,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: '#0B1220',
    padding: 6,
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 24px 55px rgba(2, 6, 23, 0.45), inset 0 0 0 1px rgba(255,255,255,0.08)',
      } as any,
    }),
  },
  dynamicIsland: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 112,
    height: 24,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: '#05070D',
    zIndex: 3,
  },
  sideButtonTop: {
    position: 'absolute',
    left: -3,
    top: 120,
    width: 3,
    height: 34,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: '#1F2937',
  },
  sideButtonBottom: {
    position: 'absolute',
    left: -3,
    top: 166,
    width: 3,
    height: 52,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    backgroundColor: '#1F2937',
  },
  sideButtonRight: {
    position: 'absolute',
    right: -3,
    top: 150,
    width: 3,
    height: 64,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: '#1F2937',
  },
  iphonePerspective: {
    flex: 1,
    position: 'relative',
  },
  iphoneShadowLayer: {
    position: 'absolute',
    left: 12,
    right: 10,
    top: 16,
    bottom: 10,
    borderRadius: 40,
    backgroundColor: '#020617',
    opacity: 0.4,
    ...Platform.select({
      web: {
        filter: 'blur(16px)',
      } as any,
    }),
  },
  iphoneRimGlow: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 4,
    bottom: 4,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.26)',
  },
  statusBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBarCompact: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 4,
  },
  time: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  timeCompact: {
    fontSize: 12,
  },
  notch: {
    width: 96,
    height: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#111827',
  },
  statusIcons: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  header: {
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerTitleCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  headerMeta: {
    fontSize: 20,
    lineHeight: 26,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 6,
  },
  headerMetaCompact: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  chipActive: {
    backgroundColor: '#FFFFFF',
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  chipTextCompact: {
    fontSize: 10,
  },
  chipTextActive: {
    color: '#111827',
  },
  cardsScroll: {
    flex: 1,
  },
  cardsContent: {
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    color: '#111827',
  },
  cardTitleCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
  cardMeta: {
    fontSize: 15,
    lineHeight: 20,
    color: '#4B5563',
    marginTop: 8,
  },
  cardMetaCompact: {
    fontSize: 10,
    lineHeight: 13,
    marginTop: 4,
  },
  cardStat: {
    marginTop: 10,
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tabTextCompact: {
    fontSize: 9,
  },
  tabTextActive: {
    color: '#2563EB',
  },
  section: {
    width: '100%',
    backgroundColor: '#EEF2F7',
    paddingVertical: 56,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  sectionSubtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 820,
  },
  screenGrid: {
    marginTop: 24,
    width: '100%',
    maxWidth: 1320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  screenCard: {
    width: 230,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  screenCardActive: {
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  screenCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  miniPhoneWrap: {
    height: 340,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
