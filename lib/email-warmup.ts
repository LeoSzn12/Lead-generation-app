/**
 * Email warmup engine
 * Gradually increases sending volume to build sender reputation
 * 
 * Schedule:
 *   Phase 1 (Day 1-7):   5 emails/day
 *   Phase 2 (Day 8-14):  15 emails/day
 *   Phase 3 (Day 15-21): 30 emails/day
 *   Phase 4 (Day 22+):   50 emails/day
 */

import { prisma } from '@/lib/db';

export interface WarmupStatus {
  phase: number;
  day: number;
  dailyLimit: number;
  dailySent: number;
  isReady: boolean; // Phase 4 = fully warmed up
  nextPhaseIn: number; // Days until next phase
  phaseLabel: string;
}

/**
 * Warmup phases configuration
 */
const WARMUP_PHASES = [
  { phase: 1, days: 7,  limit: 5,  label: '🟡 Warming Up' },
  { phase: 2, days: 14, limit: 15, label: '🟠 Ramping Up' },
  { phase: 3, days: 21, limit: 30, label: '🔵 Growing' },
  { phase: 4, days: 999, limit: 50, label: '🟢 Ready' },
];

/**
 * Get the current warmup phase config for a given day
 */
function getPhaseForDay(day: number): typeof WARMUP_PHASES[0] {
  for (const phase of WARMUP_PHASES) {
    if (day <= phase.days) {
      return phase;
    }
  }
  return WARMUP_PHASES[WARMUP_PHASES.length - 1];
}

/**
 * Get warmup status for an email account
 */
export async function getWarmupStatus(accountId: string): Promise<WarmupStatus | null> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) return null;

  const phase = getPhaseForDay(account.warmupDay);
  const currentPhaseIndex = WARMUP_PHASES.findIndex(p => p.phase === phase.phase);
  const nextPhase = WARMUP_PHASES[currentPhaseIndex + 1];

  return {
    phase: phase.phase,
    day: account.warmupDay,
    dailyLimit: account.dailySendLimit,
    dailySent: account.dailySentCount,
    isReady: phase.phase === 4,
    nextPhaseIn: nextPhase ? nextPhase.days - account.warmupDay : 0,
    phaseLabel: phase.label,
  };
}

/**
 * Start warmup for an email account
 */
export async function startWarmup(accountId: string): Promise<void> {
  await prisma.emailAccount.update({
    where: { id: accountId },
    data: {
      warmupEnabled: true,
      warmupPhase: 1,
      warmupDay: 1,
      warmupStartedAt: new Date(),
      dailySendLimit: WARMUP_PHASES[0].limit,
      dailySentCount: 0,
      dailyResetAt: new Date(),
    },
  });
}

/**
 * Advance warmup by one day (call daily via cron or scheduled task)
 * Updates all active accounts' warmup state
 */
export async function advanceWarmupDay(): Promise<{ updated: number }> {
  const accounts = await prisma.emailAccount.findMany({
    where: {
      warmupEnabled: true,
      isActive: true,
    },
  });

  let updated = 0;

  for (const account of accounts) {
    const newDay = account.warmupDay + 1;
    const phase = getPhaseForDay(newDay);

    await prisma.emailAccount.update({
      where: { id: account.id },
      data: {
        warmupDay: newDay,
        warmupPhase: phase.phase,
        dailySendLimit: phase.limit,
        dailySentCount: 0, // Reset daily counter
        dailyResetAt: new Date(),
        // Update reputation based on success rate
        reputation: calculateReputation(account),
      },
    });

    updated++;
  }

  return { updated };
}

/**
 * Calculate sender reputation based on send history
 */
function calculateReputation(account: any): number {
  let reputation = account.reputation;

  // No errors = slight improvement
  if (!account.lastError) {
    reputation = Math.min(100, reputation + 1);
  } else {
    // Has errors = reputation drops
    reputation = Math.max(0, reputation - 5);
  }

  return reputation;
}

/**
 * Skip warmup (set to max immediately) - use with caution
 */
export async function skipWarmup(accountId: string): Promise<void> {
  await prisma.emailAccount.update({
    where: { id: accountId },
    data: {
      warmupEnabled: false,
      warmupPhase: 4,
      warmupDay: 22,
      dailySendLimit: WARMUP_PHASES[3].limit,
    },
  });
}

/**
 * Pause warmup
 */
export async function pauseWarmup(accountId: string): Promise<void> {
  await prisma.emailAccount.update({
    where: { id: accountId },
    data: {
      warmupEnabled: false,
    },
  });
}

/**
 * Resume warmup from where it left off
 */
export async function resumeWarmup(accountId: string): Promise<void> {
  await prisma.emailAccount.update({
    where: { id: accountId },
    data: {
      warmupEnabled: true,
    },
  });
}

/**
 * Check if an account can send emails right now
 */
export async function canSendNow(accountId: string): Promise<{
  canSend: boolean;
  reason?: string;
  remainingToday: number;
}> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) {
    return { canSend: false, reason: 'Account not found', remainingToday: 0 };
  }

  if (!account.isActive) {
    return { canSend: false, reason: 'Account is inactive', remainingToday: 0 };
  }

  if (!account.isVerified) {
    return { canSend: false, reason: 'Account not verified. Test connection first.', remainingToday: 0 };
  }

  // Check daily limit (reset if needed)
  const now = new Date();
  const lastReset = new Date(account.dailyResetAt);
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

  let dailySent = account.dailySentCount;
  if (hoursSinceReset >= 24) {
    dailySent = 0;
    // Will be reset on next send
  }

  const remaining = Math.max(0, account.dailySendLimit - dailySent);

  if (remaining <= 0) {
    return { canSend: false, reason: 'Daily send limit reached. Resets in ' + Math.ceil(24 - hoursSinceReset) + ' hours.', remainingToday: 0 };
  }

  return { canSend: true, remainingToday: remaining };
}

/**
 * Get warmup progress as percentage
 */
export function getWarmupProgress(day: number): number {
  // Phase 4 starts at day 22
  return Math.min(100, Math.round((day / 22) * 100));
}

/**
 * Get best send time with human-like randomization
 * Returns a delay in milliseconds to add to the base send time
 */
export function getRandomizedDelay(baseDelaySeconds: number): number {
  // Add ±30% randomization
  const variation = baseDelaySeconds * 0.3;
  const randomOffset = (Math.random() * 2 - 1) * variation;
  return Math.max(30, baseDelaySeconds + randomOffset) * 1000;
}
