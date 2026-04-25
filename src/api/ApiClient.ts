import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../config/env'
import { tokenStorage } from './auth/tokenStorage'
import { session } from './auth/session'

export class ApiClient {
  private client: AxiosInstance

  constructor(baseURL: string = config.apiBaseUrl) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const stored = tokenStorage.get()
        const token = stored && !tokenStorage.isExpired() ? stored.accessToken : null
        if (token) {
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${token}`
        }
        // Add transaction ID if not present
        config.headers = config.headers ?? {}
        if (!config.headers['X-Transaction-ID']) {
          config.headers['X-Transaction-ID'] = this.generateTransactionId()
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle 401
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          session.logout(true)
        }
        return Promise.reject(error)
      }
    )
  }

  private generateTransactionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /** @deprecated Prefer using login() + tokenStorage via useLogin(). Kept for compatibility. */
  public setToken(token: string): void {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000
    tokenStorage.set({ accessToken: token, expiresAt })
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

export const apiClient = new ApiClient()
