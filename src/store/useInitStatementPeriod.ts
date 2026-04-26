import { useEffect } from 'react'
import { useCurrentStatementPeriod } from '../features/statements/hooks/useCurrentStatementPeriod'
import { useStatementPeriodStore } from './useStatementPeriodStore'

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

function buildStatementPeriodWindow(current: string | null | undefined, monthsBack: number = 6, monthsForward: number = 6): string[] {
  if (!current) return [];
  const parsed = parseStatementPeriod(current);
  if (!parsed) return [];
  const periods: string[] = [];
  for (let offset = -monthsBack; offset <= monthsForward; offset++) {
    const p = addMonths(parsed, offset);
    periods.push(formatStatementPeriod(p.monthIndex, p.year));
  }
  return periods;
}

export function useInitStatementPeriod() {
  const { data, isPending, isError } = useCurrentStatementPeriod();
  const setAvailablePeriods = useStatementPeriodStore(s => s.setAvailablePeriods);
  const setSelectedPeriod = useStatementPeriodStore(s => s.setSelectedPeriod);
  const setLoading = useStatementPeriodStore(s => s.setLoading);
  const setError = useStatementPeriodStore(s => s.setError);
  const availablePeriods = useStatementPeriodStore(s => s.availablePeriods);
  const selectedPeriod = useStatementPeriodStore(s => s.selectedPeriod);

  useEffect(() => {
    setLoading(isPending);
    setError(isError);
    if (data?.statementPeriod) {
      const periods = buildStatementPeriodWindow(data.statementPeriod, 6, 6);
      setAvailablePeriods(periods);
      // Default to the current period (middle of the window)
      if (!selectedPeriod && periods.length > 0) {
        setSelectedPeriod(periods[6] ?? periods[periods.length - 1]);
      }
    }
  }, [data, isPending, isError, setAvailablePeriods, setSelectedPeriod, setLoading, setError, selectedPeriod]);
}
