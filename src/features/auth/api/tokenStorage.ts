const ACCESS_TOKEN_KEY = 'accessToken'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt'

export type StoredAccessToken = {
  accessToken: string
  /** epoch millis */
  expiresAt: number
}

export const tokenStorage = {
  get(): StoredAccessToken | null {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    const expiresAtRaw = localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
    if (!accessToken || !expiresAtRaw) return null

    const expiresAt = Number(expiresAtRaw)
    if (!Number.isFinite(expiresAt)) return null

    return { accessToken, expiresAt }
  },

  set(token: StoredAccessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token.accessToken)
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, String(token.expiresAt))
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
  },

  isExpired(leewayMs: number = 30_000): boolean {
    const stored = this.get()
    if (!stored) return true
    return Date.now() + leewayMs >= stored.expiresAt
  },
}

