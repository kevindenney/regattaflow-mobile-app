import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { supabase } from '@/services/supabase'
import { useInterest } from '@/providers/InterestProvider'
import { isMissingSupabaseColumn } from '@/lib/utils/supabaseSchemaFallback'

type CatalogTab = 'interests' | 'organizations' | 'coaches' | 'people'

type OrganizationRow = {
  id: string
  name: string
  slug: string | null
  interest_slug: string | null
  join_mode: string | null
}

type MembershipRow = {
  user_id: string
  organization_id: string
  role: string | null
  status: string | null
  membership_status: string | null
}

type UserRow = {
  id: string
  full_name: string | null
  email: string | null
}

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function isActiveMembership(row: MembershipRow): boolean {
  const membershipStatus = normalize(row.membership_status)
  const status = normalize(row.status)
  return membershipStatus === 'active' || status === 'active'
}

function isCoachRole(role: string | null): boolean {
  const normalized = normalize(role)
  if (!normalized) return false
  if (normalized.includes('coach')) return true
  return (
    normalized === 'admin'
    || normalized === 'preceptor'
    || normalized === 'instructor'
    || normalized === 'clinical_instructor'
    || normalized === 'evaluator'
    || normalized === 'assessor'
  )
}

export default function CatalogScreen() {
  const { allInterests, userInterests, currentInterest, addInterest, removeInterest, switchInterest } = useInterest()
  const [tab, setTab] = useState<CatalogTab>('interests')
  const [query, setQuery] = useState('')
  const [selectedInterestSlug, setSelectedInterestSlug] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([])
  const [memberships, setMemberships] = useState<MembershipRow[]>([])
  const [usersById, setUsersById] = useState<Map<string, UserRow>>(new Map())

  const visibleInterestSlugs = useMemo(() => new Set(userInterests.map((interest) => interest.slug)), [userInterests])

  useEffect(() => {
    if (currentInterest?.slug) {
      setSelectedInterestSlug(currentInterest.slug)
    }
  }, [currentInterest?.slug])

  const loadCatalogData = useCallback(async () => {
    setLoading(true)
    setErrorText(null)
    try {
      let organizationsResult = await supabase
        .from('organizations')
        .select('id,name,slug,interest_slug,join_mode')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (
        organizationsResult.error
        && (
          isMissingSupabaseColumn(organizationsResult.error, 'organizations.is_active')
          || isMissingSupabaseColumn(organizationsResult.error, 'organizations.join_mode')
          || isMissingSupabaseColumn(organizationsResult.error, 'organizations.interest_slug')
        )
      ) {
        organizationsResult = await supabase
          .from('organizations')
          .select('id,name,slug')
          .order('name', { ascending: true })
      }

      if (organizationsResult.error) throw organizationsResult.error

      const orgRows = (organizationsResult.data || []).map((row: any) => ({
        id: String(row.id),
        name: String(row.name || ''),
        slug: row.slug ? String(row.slug) : null,
        interest_slug: row.interest_slug ? String(row.interest_slug) : null,
        join_mode: row.join_mode ? String(row.join_mode) : null,
      }))

      const filteredOrgs = selectedInterestSlug === 'all'
        ? orgRows
        : orgRows.filter((row) => normalize(row.interest_slug) === normalize(selectedInterestSlug))

      setOrganizations(filteredOrgs)

      const orgIds = filteredOrgs.map((row) => row.id)
      if (orgIds.length === 0) {
        setMemberships([])
        setUsersById(new Map())
        return
      }

      let membershipResult = await supabase
        .from('organization_memberships')
        .select('user_id,organization_id,role,status,membership_status')
        .in('organization_id', orgIds)
        .order('created_at', { ascending: false })
        .limit(2000)

      if (membershipResult.error && isMissingSupabaseColumn(membershipResult.error, 'organization_memberships.membership_status')) {
        membershipResult = await supabase
          .from('organization_memberships')
          .select('user_id,organization_id,role,status')
          .in('organization_id', orgIds)
          .order('created_at', { ascending: false })
          .limit(2000)
      }

      if (membershipResult.error) throw membershipResult.error
      const memberRows = (membershipResult.data || []).map((row: any) => ({
        user_id: String(row.user_id || ''),
        organization_id: String(row.organization_id || ''),
        role: row.role ? String(row.role) : null,
        status: row.status ? String(row.status) : null,
        membership_status: row.membership_status ? String(row.membership_status) : null,
      }))
      setMemberships(memberRows)

      const userIds = Array.from(new Set(memberRows.map((row) => row.user_id).filter(Boolean)))
      if (userIds.length === 0) {
        setUsersById(new Map())
        return
      }

      const usersResult = await supabase
        .from('users')
        .select('id,full_name,email')
        .in('id', userIds)
        .limit(4000)

      if (usersResult.error) throw usersResult.error

      const nextUsers = new Map<string, UserRow>()
      for (const row of usersResult.data || []) {
        nextUsers.set(String((row as any).id), {
          id: String((row as any).id),
          full_name: (row as any).full_name ? String((row as any).full_name) : null,
          email: (row as any).email ? String((row as any).email) : null,
        })
      }
      setUsersById(nextUsers)
    } catch (error: any) {
      setErrorText(String(error?.message || 'Failed to load catalog'))
    } finally {
      setLoading(false)
    }
  }, [selectedInterestSlug])

  useEffect(() => {
    void loadCatalogData()
  }, [loadCatalogData])

  const organizationById = useMemo(() => {
    const map = new Map<string, OrganizationRow>()
    for (const row of organizations) {
      map.set(row.id, row)
    }
    return map
  }, [organizations])

  const peopleRows = useMemo(() => {
    const perUser = new Map<string, { user: UserRow | null; orgNames: string[]; roleSet: Set<string> }>()
    for (const row of memberships) {
      if (!isActiveMembership(row)) continue
      const user = usersById.get(row.user_id) || null
      const existing = perUser.get(row.user_id) || {
        user,
        orgNames: [],
        roleSet: new Set<string>(),
      }
      const orgName = organizationById.get(row.organization_id)?.name
      if (orgName && !existing.orgNames.includes(orgName)) {
        existing.orgNames.push(orgName)
      }
      if (row.role) {
        existing.roleSet.add(row.role)
      }
      perUser.set(row.user_id, existing)
    }
    return Array.from(perUser.entries()).map(([userId, entry]) => ({
      userId,
      name: entry.user?.full_name || entry.user?.email || userId,
      email: entry.user?.email || null,
      organizations: entry.orgNames.sort((a, b) => a.localeCompare(b)),
      roles: Array.from(entry.roleSet),
      isCoach: Array.from(entry.roleSet).some((role) => isCoachRole(role)),
    }))
  }, [memberships, organizationById, usersById])

  const coachRows = useMemo(() => peopleRows.filter((row) => row.isCoach), [peopleRows])

  const normalizedQuery = normalize(query)
  const matchesQuery = useCallback(
    (text: string) => normalize(text).includes(normalizedQuery),
    [normalizedQuery],
  )

  const filteredOrganizations = useMemo(() => {
    if (!normalizedQuery) return organizations
    return organizations.filter((row) => matchesQuery(`${row.name} ${row.slug || ''} ${row.interest_slug || ''}`))
  }, [normalizedQuery, organizations, matchesQuery])

  const filteredPeople = useMemo(() => {
    if (!normalizedQuery) return peopleRows
    return peopleRows.filter((row) => {
      const orgText = row.organizations.join(' ')
      return matchesQuery(`${row.name} ${row.email || ''} ${orgText}`)
    })
  }, [normalizedQuery, peopleRows, matchesQuery])

  const filteredCoaches = useMemo(() => {
    if (!normalizedQuery) return coachRows
    return coachRows.filter((row) => {
      const orgText = row.organizations.join(' ')
      return matchesQuery(`${row.name} ${row.email || ''} ${orgText}`)
    })
  }, [normalizedQuery, coachRows, matchesQuery])

  const interestOptions = useMemo(
    () => [{ slug: 'all', name: 'All interests' }, ...allInterests.map((interest) => ({ slug: interest.slug, name: interest.name }))],
    [allInterests],
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.title}>Catalog</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.tabsRow}>
        {(['interests', 'organizations', 'coaches', 'people'] as CatalogTab[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tabPill, tab === item && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>
              {item[0].toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.interestFilterRow}>
        {interestOptions.map((option) => (
          <Pressable
            key={option.slug}
            onPress={() => setSelectedInterestSlug(option.slug)}
            style={[styles.filterPill, selectedInterestSlug === option.slug && styles.filterPillActive]}
          >
            <Text style={[styles.filterPillText, selectedInterestSlug === option.slug && styles.filterPillTextActive]}>
              {option.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.stateText}>Loading catalog…</Text>
        </View>
      ) : null}

      {!loading && errorText ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{errorText}</Text>
          <Pressable onPress={() => void loadCatalogData()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !errorText ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {tab === 'interests' ? (
            allInterests.map((interest) => {
              const added = visibleInterestSlugs.has(interest.slug)
              const isCurrent = currentInterest?.slug === interest.slug
              return (
                <View key={interest.id} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <View style={styles.rowGrow}>
                      <View style={[styles.dot, { backgroundColor: interest.accent_color || '#2563EB' }]} />
                      <View style={styles.rowGrow}>
                        <Text style={styles.cardTitle}>{interest.name}</Text>
                        <Text style={styles.cardMeta}>{interest.slug}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => void (added ? removeInterest(interest.slug) : addInterest(interest.slug))}
                      style={[styles.actionBtn, added ? styles.removeBtn : styles.addBtn]}
                    >
                      <Text style={[styles.actionText, added ? styles.removeText : styles.addText]}>
                        {added ? 'Remove' : 'Add'}
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardMeta}>{interest.description || 'No description'}</Text>
                    <Pressable
                      onPress={() => void switchInterest(interest.slug)}
                      style={[styles.setActiveBtn, isCurrent && styles.setActiveBtnCurrent]}
                    >
                      <Text style={[styles.setActiveText, isCurrent && styles.setActiveTextCurrent]}>
                        {isCurrent ? 'Current' : 'Set active'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )
            })
          ) : null}

          {tab === 'organizations' ? (
            filteredOrganizations.map((org) => (
              <View key={org.id} style={styles.card}>
                <Text style={styles.cardTitle}>{org.name}</Text>
                <Text style={styles.cardMeta}>
                  {(org.interest_slug || 'no-interest-tag')} · {(org.join_mode || 'invite_only')}
                </Text>
              </View>
            ))
          ) : null}

          {tab === 'coaches' ? (
            filteredCoaches.map((row) => (
              <View key={row.userId} style={styles.card}>
                <Text style={styles.cardTitle}>{row.name}</Text>
                <Text style={styles.cardMeta}>{row.email || 'No email'}</Text>
                <Text style={styles.cardMeta}>Orgs: {row.organizations.join(', ') || '—'}</Text>
              </View>
            ))
          ) : null}

          {tab === 'people' ? (
            filteredPeople.map((row) => (
              <View key={row.userId} style={styles.card}>
                <Text style={styles.cardTitle}>{row.name}</Text>
                <Text style={styles.cardMeta}>{row.email || 'No email'}</Text>
                <Text style={styles.cardMeta}>Orgs: {row.organizations.join(', ') || '—'}</Text>
              </View>
            ))
          ) : null}

          {tab === 'organizations' && filteredOrganizations.length === 0 ? (
            <Text style={styles.emptyText}>No organizations found.</Text>
          ) : null}
          {tab === 'coaches' && filteredCoaches.length === 0 ? (
            <Text style={styles.emptyText}>No coaches found.</Text>
          ) : null}
          {tab === 'people' && filteredPeople.length === 0 ? (
            <Text style={styles.emptyText}>No people found.</Text>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  tabPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  tabPillActive: {
    backgroundColor: '#DBEAFE',
  },
  tabText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  interestFilterRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  filterPillActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  filterPillText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#1D4ED8',
  },
  searchWrap: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  stateText: {
    fontSize: 13,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: '#2563EB',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowGrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionBtn: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  addBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  removeBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addText: { color: '#047857' },
  removeText: { color: '#B91C1C' },
  setActiveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
  },
  setActiveBtnCurrent: {
    backgroundColor: '#DBEAFE',
  },
  setActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  setActiveTextCurrent: {
    color: '#1E40AF',
  },
  emptyText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
})
