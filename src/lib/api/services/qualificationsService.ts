/**
 * Qualifications Service
 */

import apiClient from '../client';
import { PaginatedResponse } from '../types';

export interface Qualification {
  id: number;
  name: string;
  description?: string;
  code: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQualificationData {
  name: string;
  description?: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateQualificationData {
  name?: string;
  description?: string;
  code?: string;
  isActive?: boolean;
}

export interface QualificationsListParams {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
}

const QUALIFICATIONS_API_URL = '/api/admin/qualifications';

export const qualificationsService = {
  /**
   * Get all qualifications
   */
  async getAll(params?: QualificationsListParams): Promise<PaginatedResponse<Qualification>> {
    const response = await apiClient.get<PaginatedResponse<Qualification>>(
      QUALIFICATIONS_API_URL,
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Get qualification by ID
   */
  async getById(id: number): Promise<Qualification> {
    const response = await apiClient.get<Qualification>(`${QUALIFICATIONS_API_URL}/${id}`);
    return response.data;
  },

  /**
   * Create new qualification
   */
  async create(data: CreateQualificationData): Promise<Qualification> {
    const response = await apiClient.post<Qualification>(QUALIFICATIONS_API_URL, data);
    return response.data;
  },

  /**
   * Update qualification
   */
  async update(id: number, data: UpdateQualificationData): Promise<Qualification> {
    const response = await apiClient.put<Qualification>(`${QUALIFICATIONS_API_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete qualification
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${QUALIFICATIONS_API_URL}/${id}`);
  },
};

