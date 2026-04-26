import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useCurrentStatementPeriod } from '../features/statements/hooks/useCurrentStatementPeriod';

const MONTHS = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
] as const;

type MonthName = (typeof MONTHS)[number];
type ParsedStatementPeriod = { monthIndex: number; year: number };

function parseStatementPeriod(period: string): ParsedStatementPeriod | null {
  const match = /^([A-Z]+)(\d{4})$/.exec(period.trim().toUpperCase());
  if (!match) return null;
  const monthName = match[1] as MonthName;
  const monthIndex = MONTHS.indexOf(monthName);
  if (monthIndex === -1) return null;
  const year = Number(match[2]);
  if (!Number.isFinite(year)) return null;
  return { monthIndex, year };
}

function formatStatementPeriod(monthIndex: number, year: number): string {
  return `${MONTHS[monthIndex]}${year}`;
}

function addMonths(value: ParsedStatementPeriod, deltaMonths: number): ParsedStatementPeriod {
  const total = value.year * 12 + value.monthIndex + deltaMonths;
  const year = Math.floor(total / 12);
  const monthIndex = ((total % 12) + 12) % 12;
  return { year, monthIndex };
}

function buildStatementPeriodWindow(current: string | null | undefined, monthsBack: number = 4): string[] {
  if (!current) return [];
  const parsed = parseStatementPeriod(current);
  if (!parsed) return [];
  const periods: string[] = [];
  for (let offset = -monthsBack; offset <= 0; offset++) {
    const p = addMonths(parsed, offset);
    periods.push(formatStatementPeriod(p.monthIndex, p.year));
  }
  return periods;
}

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
  const availablePeriods = useMemo(() => buildStatementPeriodWindow(currentStatementPeriod?.statementPeriod, 4), [currentStatementPeriod]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  useEffect(() => {
    if (selectedPeriod) return;
    if (availablePeriods.length === 0) return;
    setSelectedPeriod(availablePeriods[4] ?? availablePeriods[availablePeriods.length - 1]);
  }, [selectedPeriod, availablePeriods]);
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
