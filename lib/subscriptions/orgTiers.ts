/**
 * Organization (Institutional) Tier Definitions
 *
 * Updated: 2026-03-23
 * Pricing:
 * - Starter: $500/yr flat (≤25 seats), members get Individual tier
 * - Department: $15/seat/yr (26-500 seats), members get Pro tier
 * - Enterprise: Custom (500+ seats), members get Pro tier + MCP
 */

import type { SailorTier } from './sailorTiers';

export type OrgPlanId = 'starter' | 'department' | 'enterprise';

export interface OrgPlanDefinition {
  id: OrgPlanId;
  name: string;
  description: string;
  price: string;
  priceDetail: string;
  minSeats: number;
  maxSeats: number;
  memberTier: SailorTier;
  mcpAccess: boolean;
  features: string[];
  cta: string;
  ctaAction: 'checkout' | 'contact';
  isPopular?: boolean;
  accentColor: string;
  iconName: string;
}

export const ORG_PLANS: Record<OrgPlanId, OrgPlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small programs and departments',
    price: '$500',
    priceDetail: '/year flat',
    minSeats: 1,
    maxSeats: 25,
    memberTier: 'individual',
    mcpAccess: false,
    features: [
      'Up to 25 seats',
      'Members get Individual tier access',
      'Centralized billing',
      'Member management dashboard',
      'Usage analytics',
      'Email support',
    ],
    cta: 'Get Started',
    ctaAction: 'checkout',
    accentColor: '#2563EB',
    iconName: 'school-outline',
  },
  department: {
    id: 'department',
    name: 'Department',
    description: 'For growing departments and programs',
    price: '$15',
    priceDetail: '/seat/year',
    minSeats: 26,
    maxSeats: 500,
    memberTier: 'pro',
    mcpAccess: false,
    features: [
      '26–500 seats',
      'Members get Pro tier access',
      'Centralized billing',
      'Member management dashboard',
      'Usage & engagement analytics',
      'Priority support',
      'SSO integration',
    ],
    cta: 'Get Started',
    ctaAction: 'checkout',
    isPopular: true,
    accentColor: '#7C3AED',
    iconName: 'business-outline',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large institutions with custom needs',
    price: 'Custom',
    priceDetail: '',
    minSeats: 501,
    maxSeats: Infinity,
    memberTier: 'pro',
    mcpAccess: true,
    features: [
      'Unlimited seats',
      'Members get Pro tier access',
      'MCP / AI assistant integration',
      'Dedicated account manager',
      'Custom onboarding',
      'SLA guarantee',
      'SSO & SAML',
      'API access',
    ],
    cta: 'Contact Sales',
    ctaAction: 'contact',
    accentColor: '#059669',
    iconName: 'globe-outline',
  },
};

export const ORG_PLAN_LIST: OrgPlanDefinition[] = [
  ORG_PLANS.starter,
  ORG_PLANS.department,
  ORG_PLANS.enterprise,
];

/**
 * Get the SailorTier that members of an org plan receive
 */
export function getOrgMemberTier(planId: OrgPlanId): SailorTier {
  return ORG_PLANS[planId]?.memberTier ?? 'individual';
}

/**
 * Calculate annual cost for a seat-based plan
 */
export function calculateOrgPlanCost(planId: OrgPlanId, seatCount: number): number | null {
  switch (planId) {
    case 'starter':
      return 50000; // $500 flat in cents
    case 'department':
      return seatCount * 1500; // $15/seat in cents
    case 'enterprise':
      return null; // Custom pricing
    default:
      return null;
  }
}
