import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../config/env'

/**
 * HTTP client for agent endpoints (e.g., DigitalOcean chat-completions).
 * Does NOT have the auto-logout interceptor, since agent endpoints
 * authenticate independently (not with the app's JWT).
 */
export class AgentClient {
  private client: AxiosInstance

  constructor(baseURL: string = config.agentApiBaseUrl) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - only add transaction ID
    this.client.interceptors.request.use(
      (config) => {
        // Add transaction ID for tracing
        config.headers = config.headers ?? {}
        if (!config.headers['X-Transaction-ID']) {
          config.headers['X-Transaction-ID'] = this.generateTransactionId()
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // NO response interceptor - agent requests fail gracefully without redirecting to login
  }

  private generateTransactionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  public post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  public put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }
}



