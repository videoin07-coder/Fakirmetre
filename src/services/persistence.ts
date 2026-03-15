import { DEFAULT_PROFILE, DEFAULT_SETTINGS, STORAGE_KEYS } from '../config';
import { Analytics, Storage, safeJsonParse } from '../core';
import type { ExpenseEntry, HistoryItem, MealEntry, NotificationItem, PremiumTier, Profile, SavingsGoal, SettingsState } from '../types';

export type PersistedAppData = {
  profile: Profile;
  history: HistoryItem[];
  settings: SettingsState;
  premium: PremiumTier;
  notifications: NotificationItem[];
  aiUsageCount: number;
  lastCloudBackupAt: string;
  meals: MealEntry[];
  expenses: ExpenseEntry[];
  savingsGoals: SavingsGoal[];
  monthlyBudgetLimit: number;
};

export async function loadPersistedAppData(): Promise<PersistedAppData | null> {
  const entries = await Storage.multiGet([
    STORAGE_KEYS.profile,
    STORAGE_KEYS.history,
    STORAGE_KEYS.settings,
    STORAGE_KEYS.analytics,
    STORAGE_KEYS.cloudBackup,
    STORAGE_KEYS.aiUsage,
    STORAGE_KEYS.premium,
    STORAGE_KEYS.notifications,
    STORAGE_KEYS.meals,
    STORAGE_KEYS.expenses,
    STORAGE_KEYS.savingsGoals,
    STORAGE_KEYS.monthlyBudgetLimit,
  ]);
  const map = Object.fromEntries(entries);
  const profile = safeJsonParse<Profile | null>(map[STORAGE_KEYS.profile], null);
  if (!profile) return null;

  const cloudBackupSnapshot = safeJsonParse<{ exportedAt?: string } | null>(map[STORAGE_KEYS.cloudBackup], null);

  Analytics.hydrate(safeJsonParse(map[STORAGE_KEYS.analytics], []));

  return {
    profile: { ...DEFAULT_PROFILE, ...profile },
    history: safeJsonParse<HistoryItem[]>(map[STORAGE_KEYS.history], []),
    settings: { ...DEFAULT_SETTINGS, ...safeJsonParse<SettingsState>(map[STORAGE_KEYS.settings], DEFAULT_SETTINGS) },
    premium: safeJsonParse<PremiumTier>(map[STORAGE_KEYS.premium], 'free'),
    notifications: safeJsonParse<NotificationItem[]>(map[STORAGE_KEYS.notifications], []),
    aiUsageCount: safeJsonParse<number>(map[STORAGE_KEYS.aiUsage], 0),
    lastCloudBackupAt: typeof cloudBackupSnapshot?.exportedAt === 'string' ? cloudBackupSnapshot.exportedAt : '',
    meals: safeJsonParse<MealEntry[]>(map[STORAGE_KEYS.meals], []),
    expenses: safeJsonParse<ExpenseEntry[]>(map[STORAGE_KEYS.expenses], []),
    savingsGoals: safeJsonParse<SavingsGoal[]>(map[STORAGE_KEYS.savingsGoals], []),
    monthlyBudgetLimit: safeJsonParse<number>(map[STORAGE_KEYS.monthlyBudgetLimit], 0),
  };
}

export async function savePersistedAppData(data: PersistedAppData) {
  await Storage.multiSet([
    [STORAGE_KEYS.profile, JSON.stringify(data.profile)],
    [STORAGE_KEYS.history, JSON.stringify(data.history)],
    [STORAGE_KEYS.settings, JSON.stringify(data.settings)],
    [STORAGE_KEYS.premium, JSON.stringify(data.premium)],
    [STORAGE_KEYS.notifications, JSON.stringify(data.notifications)],
    [STORAGE_KEYS.aiUsage, JSON.stringify(data.aiUsageCount)],
    [STORAGE_KEYS.meals, JSON.stringify(data.meals)],
    [STORAGE_KEYS.expenses, JSON.stringify(data.expenses)],
    [STORAGE_KEYS.savingsGoals, JSON.stringify(data.savingsGoals)],
    [STORAGE_KEYS.monthlyBudgetLimit, JSON.stringify(data.monthlyBudgetLimit)],
  ]);
}

export async function resetPersistedAppData() {
  await Promise.all([
    Storage.remove(STORAGE_KEYS.profile),
    Storage.remove(STORAGE_KEYS.history),
    Storage.remove(STORAGE_KEYS.settings),
    Storage.remove(STORAGE_KEYS.premium),
    Storage.remove(STORAGE_KEYS.notifications),
    Storage.remove(STORAGE_KEYS.aiUsage),
    Storage.remove(STORAGE_KEYS.cloudBackup),
    Storage.remove(STORAGE_KEYS.meals),
    Storage.remove(STORAGE_KEYS.expenses),
    Storage.remove(STORAGE_KEYS.savingsGoals),
    Storage.remove(STORAGE_KEYS.monthlyBudgetLimit),
  ]);
}
