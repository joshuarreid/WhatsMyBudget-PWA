import { ApiClient } from '../ApiClient'

/**
 * Cache endpoints are not under /api/v2 and are not JWT-protected.
 */
export const cacheApiClient = new ApiClient(
  'https://wmb-service-fs4j9.ondigitalocean.app'
)

export const cacheBasePath = '/api/cache'

