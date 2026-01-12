/**
 * Operations Service
 * Example service for operations endpoints
 */

import apiClient from '../client';
import { PaginatedResponse } from '../types';

export interface Operation {
  id: string;
  [key: string]: unknown;
}

export const operationsService = {
  /**
   * Get all operations
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Operation>> {
    const response = await apiClient.get<PaginatedResponse<Operation>>('/api/operations', {
      params,
    });
    return response.data;
  },

  /**
   * Get operation by ID
   */
  async getById(id: string): Promise<Operation> {
    const response = await apiClient.get<Operation>(`/api/operations/${id}`);
    return response.data;
  },

  /**
   * Create new operation
   */
  async create(data: Partial<Operation>): Promise<Operation> {
    const response = await apiClient.post<Operation>('/api/operations', data);
    return response.data;
  },

  /**
   * Update operation
   */
  async update(id: string, data: Partial<Operation>): Promise<Operation> {
    const response = await apiClient.put<Operation>(`/api/operations/${id}`, data);
    return response.data;
  },

  /**
   * Delete operation
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/operations/${id}`);
  },
};

