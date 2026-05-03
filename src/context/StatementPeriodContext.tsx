import React, { createContext, useContext, useMemo, useState } from 'react';
import { useCurrentStatementPeriod } from '@/features/statements';
import { buildStatementPeriodWindow } from '../utils/statementPeriodWindow';

export type StatementPeriodContextType = {
  availablePeriods: string[];
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  loading: boolean;
  error: boolean;
};

const StatementPeriodContext = createContext<StatementPeriodContextType | undefined>(undefined);

export const StatementPeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: currentStatementPeriod, isPending, isError } = useCurrentStatementPeriod();
  const availablePeriods = useMemo(
    () => buildStatementPeriodWindow(currentStatementPeriod?.statementPeriod, { monthsBack: 4, monthsForward: 0 }),
    [currentStatementPeriod]
  );
  const initialSelectedPeriod = availablePeriods[4] || availablePeriods[availablePeriods.length - 1] || '';
  const [selectedPeriod, setSelectedPeriod] = useState(initialSelectedPeriod);
  return (
    <StatementPeriodContext.Provider value={{
      availablePeriods,
      selectedPeriod,
      setSelectedPeriod,
      loading: isPending,
      error: isError,
    }}>
      {children}
    </StatementPeriodContext.Provider>
  );
};

export function useStatementPeriod() {
  const ctx = useContext(StatementPeriodContext);
  if (!ctx) throw new Error('useStatementPeriod must be used within a StatementPeriodProvider');
  return ctx;
}
