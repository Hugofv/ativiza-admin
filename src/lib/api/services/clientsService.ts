/**
 * Clients Service
 * Example service for clients endpoints
 */

import apiClient from '../client';
import { PaginatedResponse } from '../types';

export interface Client {
  id: string;
  name: string;
  email?: string;
  [key: string]: unknown;
}

export const clientsService = {
  /**
   * Get all clients
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Client>> {
    const response = await apiClient.get<PaginatedResponse<Client>>('/api/clients', {
      params,
    });
    return response.data;
  },

  /**
   * Get client by ID
   */
  async getById(id: string): Promise<Client> {
    const response = await apiClient.get<Client>(`/api/clients/${id}`);
    return response.data;
  },

  /**
   * Create new client
   */
  async create(data: Partial<Client>): Promise<Client> {
    const response = await apiClient.post<Client>('/api/clients', data);
    return response.data;
  },

  /**
   * Update client
   */
  async update(id: string, data: Partial<Client>): Promise<Client> {
    const response = await apiClient.put<Client>(`/api/clients/${id}`, data);
    return response.data;
  },

  /**
   * Delete client
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/clients/${id}`);
  },
};

