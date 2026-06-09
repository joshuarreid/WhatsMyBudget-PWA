import { AgentClient } from '../../../api/AgentClient.ts'
import { config } from '@/config/env'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

export class ConversationsApiClient {
  private client: AgentClient
  private basePath = config.agentApiPath

  constructor() {
    this.client = new AgentClient()
  }

  getBasePath() {
    return this.basePath
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }
}

export const conversationsApiClient = new ConversationsApiClient()
