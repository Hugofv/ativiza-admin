/**
 * Features Service
 */

import apiClient from '../client';
import { PaginatedResponse } from '../types';

export interface ModuleOption {
  value: number;
  label: string;
}

export interface Feature {
  id: number;
  key: string; // Unique identifier (e.g., "loan_module", "advanced_reports")
  name: string;
  description?: string;
  category?: string; // e.g., "reports", "integrations", "automation"
  moduleId?: number;
  module?: {
    id: number;
    key: string;
    name: string;
  };
  isActive: boolean;
  sortOrder: number;
  meta?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeatureData {
  key: string;
  name: string;
  description?: string;
  category?: string;
  module?: ModuleOption; // For autocomplete selection
  isActive?: boolean;
  sortOrder?: number;
  meta?: Record<string, unknown>;
}

export interface UpdateFeatureData {
  name?: string;
  description?: string;
  category?: string;
  module?: ModuleOption;
  isActive?: boolean;
  sortOrder?: number;
  meta?: Record<string, unknown>;
}

export interface FeaturesListParams {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  isActive?: boolean;
}

const FEATURES_API_URL = '/api/admin/features';

export const featuresService = {
  /**
   * Get all features
   */
  async getAll(params?: FeaturesListParams): Promise<PaginatedResponse<Feature>> {
    const response = await apiClient.get<PaginatedResponse<Feature>>(
      FEATURES_API_URL,
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Get feature by ID
   */
  async getById(id: number): Promise<Feature> {
    const response = await apiClient.get<Feature>(`${FEATURES_API_URL}/${id}`);
    return response.data;
  },

  /**
   * Create new feature
   */
  async create(data: CreateFeatureData): Promise<Feature> {
    const response = await apiClient.post<Feature>(FEATURES_API_URL, data);
    return response.data;
  },

  /**
   * Update feature
   */
  async update(id: number, data: UpdateFeatureData): Promise<Feature> {
    const response = await apiClient.put<Feature>(`${FEATURES_API_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete feature
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${FEATURES_API_URL}/${id}`);
  },
};

