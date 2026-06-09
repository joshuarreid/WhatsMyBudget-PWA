export const config = {
  apiBaseUrl:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? '/api' : 'http://localhost:8081'),
  agentApiBaseUrl: '/agent-api',
  agentApiPath: normalizeApiPath(import.meta.env.VITE_AGENT_API_PATH || '/v1/chat/completions'),
  agentProxyTargetUrl: typeof import.meta.env.VITE_AGENT_API_BASE_URL === 'string'
    ? import.meta.env.VITE_AGENT_API_BASE_URL.trim()
    : '',
  agentAccessKey: typeof import.meta.env.VITE_AGENT_ACCESS_KEY === 'string'
    ? import.meta.env.VITE_AGENT_ACCESS_KEY.trim()
    : '',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  categories: parseCsv(import.meta.env.VITE_CATEGORIES),
  paymentMethods: parseCsv(import.meta.env.VITE_PAYMENT_METHODS),

  bankPaymentMethodMap: parseJsonRecord(import.meta.env.VITE_BANK_PAYMENT_METHOD_MAP),
  defaultCriticalityMap: parseJsonRecord(import.meta.env.VITE_DEFAULT_CRITICALITY_MAP),
  defaultPaymentMethodMap: parseJsonRecord(import.meta.env.VITE_DEFAULT_PAYMENT_METHOD_MAP),
} as const

function normalizeApiPath(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.replace(/\/+$/, '')
}

function parseCsv(value: unknown): string[] {
  if (typeof value !== 'string') return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseJsonRecord(value: unknown): Record<string, string> {
  if (typeof value !== 'string') return {}
  const trimmed = value.trim()
  if (!trimmed) return {}

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (!parsed || typeof parsed !== 'object') return {}

    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === 'string') out[String(k)] = v
    }
    return out
  } catch {
    return {}
  }
}
