# Conversations (Chat API)

This feature provides *data-layer* support for chat against a configurable agent endpoint (for example, a DigitalOcean agent endpoint) through a same-origin proxy path (`/agent-api`) to avoid browser CORS preflight failures.

## Exports

- API (low-level): `src/api/conversations/*`
  - `askAgent(request)` (also exported as `askRag` for backward compatibility)
  - `fetchConversationHistory(conversationId, limit?)`

- Hooks (feature-level): `src/features/conversations/hooks/*`
  - `useAskAgent()` (also exported as `useAskRag` for backward compatibility)
  - `useConversationHistory(conversationId, limit?)`

## Notes

- `ApiClient` automatically sends `Authorization` (if logged in) and `X-Transaction-ID`.
- You may pass `{ headers: { 'X-Request-ID': '...' } }` to `useAskRag` if you want request correlation.
- Endpoint config comes from env vars:
  - `VITE_AGENT_API_BASE_URL` (used as the dev proxy target)
  - `VITE_AGENT_ACCESS_KEY` (used as `Authorization: Bearer ...`)
  - `VITE_AGENT_API_PATH` (defaults to `/v1/chat/completions`)

The browser calls `/agent-api/v1/chat/completions`; Vite proxies that path to `VITE_AGENT_API_BASE_URL` in development.
export type ConversationRole = 'user' | 'assistant'

export interface ConversationMessage {
  message_id: string
  role: ConversationRole
  content: string
  period?: string | null
  period_source?: string | null
  created_at?: string
}

export interface ConversationHistoryResponse {
  conversation_id: string
  title?: string | null
  created_at?: string
  updated_at?: string
  last_message_at?: string
  messages: ConversationMessage[]
}

export interface AskRagRequest {
  question: string
  conversation_id?: string
  period?: string
  payment_method?: string
  account?: string
  transaction_id?: string
}

export interface AskRagToolSelection {
  llm_suggested_tools?: string[]
  deterministic_tools?: string[]
  union_tools?: string[]
}

export interface AskRagCitation {
  source_type: string
  source_ref: string
  source_title?: string | null
  snippet?: string | null
  score?: number | null
}

export interface AskRagToolTrace {
  tool_name: string
  context_key?: string | null
  category?: string | null
  status?: string | null
  duration_ms?: number | null
  cache_hit?: boolean | null
  arguments?: Record<string, unknown>
  result_summary?: Record<string, unknown>
  error_text?: string | null
}

export interface AskRagCacheStats {
  enabled?: boolean
  hits?: number
  misses?: number
  writes?: number
}

export interface AskRagContext {
  conversation?: {
    conversation_id: string
    history_message_count?: number
  }
  conversation_history?: ConversationMessage[]
}

export interface AskRagResponse {
  question?: string
  conversation_id: string
  period?: string
  answer: string

  // Optional debug/metadata fields
  plan?: string[]
  tool_selection?: AskRagToolSelection
  context?: AskRagContext
  citations?: AskRagCitation[]
  tool_traces?: AskRagToolTrace[]
  cache?: AskRagCacheStats
}

