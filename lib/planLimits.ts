import type { Plan } from '@prisma/client'

export interface PlanLimits {
  /** Max competitors tracked */
  maxCompetitors: number
  /** Ad history in days (0 = unlimited) */
  adHistoryDays: number
  /** Can use country filter on feed */
  countryFilter: boolean
  /** Can see trending sort */
  trendingSort: boolean
  /** Can trigger LLM visibility scan */
  llmScan: boolean
  /** Can capture landing pages */
  landingCapture: boolean
  /** Can receive email alerts per competitor */
  emailAlerts: boolean
  /** Can receive weekly digest */
  weeklyDigest: boolean
  /** Can export data (CSV / JSON) */
  export: boolean
  /** Max scan frequency in hours */
  scanFrequencyHours: number
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxCompetitors: 3,
    adHistoryDays: 7,
    countryFilter: false,
    trendingSort: false,
    llmScan: false,
    landingCapture: false,
    emailAlerts: false,
    weeklyDigest: false,
    export: false,
    scanFrequencyHours: 24,
  },
  STARTER: {
    maxCompetitors: 10,
    adHistoryDays: 30,
    countryFilter: true,
    trendingSort: true,
    llmScan: false,
    landingCapture: false,
    emailAlerts: true,
    weeklyDigest: true,
    export: false,
    scanFrequencyHours: 12,
  },
  PRO: {
    maxCompetitors: 30,
    adHistoryDays: 90,
    countryFilter: true,
    trendingSort: true,
    llmScan: true,
    landingCapture: true,
    emailAlerts: true,
    weeklyDigest: true,
    export: true,
    scanFrequencyHours: 5,
  },
  ENTERPRISE: {
    maxCompetitors: 0, // unlimited
    adHistoryDays: 0,  // unlimited
    countryFilter: true,
    trendingSort: true,
    llmScan: true,
    landingCapture: true,
    emailAlerts: true,
    weeklyDigest: true,
    export: true,
    scanFrequencyHours: 1,
  },
}

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: 'Gratuit',
  STARTER: 'Starter',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
}

export const PLAN_PRICES: Record<Plan, { monthly: number | null; annual: number | null }> = {
  FREE:       { monthly: 0,    annual: 0 },
  STARTER:    { monthly: 29,   annual: 19 },
  PRO:        { monthly: 79,   annual: 49 },
  ENTERPRISE: { monthly: null, annual: null }, // custom
}

export function getLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function canAccess(plan: Plan, feature: keyof PlanLimits): boolean {
  const limits = PLAN_LIMITS[plan]
  const val = limits[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val !== 0
  return false
}
