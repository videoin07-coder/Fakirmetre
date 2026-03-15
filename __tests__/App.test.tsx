jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { buildBackupSnapshot, buildExpenseInsights, sanitizeImportedData } from '../src/core';
import { DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../src/config';
import { getRecentExpenseAverage } from '../src/features/finance';

describe('backup sanitization', () => {
  test('keeps extended collections during import', () => {
    const snapshot = buildBackupSnapshot(
      DEFAULT_PROFILE,
      [],
      DEFAULT_SETTINGS,
      'manual-export',
      {
        meals: [{ id: 'm1', name: 'Menemen', calories: 220, time: '09:00' }],
        expenses: [{ id: 'e1', title: 'Market', amount: 420, category: 'Gıda', createdAt: new Date().toISOString() }],
        savingsGoals: [{ id: 'g1', title: 'Acil Fon', target: 5000, current: 1200, createdAt: new Date().toISOString() }],
      },
    );

    const parsed = sanitizeImportedData(snapshot, {
      profile: DEFAULT_PROFILE,
      history: [],
      settings: DEFAULT_SETTINGS,
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.meals).toHaveLength(1);
    expect(parsed?.expenses).toHaveLength(1);
    expect(parsed?.savingsGoals).toHaveLength(1);
  });
});

describe('finance insights', () => {
  test('returns bounded daily average and insight lines', () => {
    const expenses = [
      { id: 'e1', title: 'Market', amount: 350, category: 'Gıda', createdAt: new Date().toISOString() },
      { id: 'e2', title: 'Otobüs', amount: 70, category: 'Ulaşım', createdAt: new Date().toISOString() },
    ];

    expect(getRecentExpenseAverage(expenses, 7)).toBeCloseTo(60, 0);

    const insights = buildExpenseInsights(expenses, [
      { id: 'g1', title: 'Acil Fon', target: 5000, current: 1000, createdAt: new Date().toISOString() },
    ]);

    expect(insights.length).toBeGreaterThan(0);
    expect(insights.join(' ')).toContain('Acil Fon');
  });
});
