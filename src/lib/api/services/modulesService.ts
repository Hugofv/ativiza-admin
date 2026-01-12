/**
 * Modules Service
 */

import apiClient from '../client';
import { PaginatedResponse } from '../types';

export interface ModuleMeta {
  translations?: {
    [locale: string]: string;
  };
  [key: string]: unknown;
}

export interface Module {
  id: number;
  name: string;
  key: string;
  description?: string;
  meta?: ModuleMeta;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateModuleData {
  name: string;
  key: string;
  description?: string;
  meta?: ModuleMeta;
  isActive?: boolean;
}

export interface UpdateModuleData {
  name?: string;
  key?: string;
  description?: string;
  meta?: ModuleMeta;
  isActive?: boolean;
}

export interface ModulesListParams {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
}

const MODULES_API_URL = '/api/admin/modules';

export const modulesService = {
  /**
   * Get all modules
   */
  async getAll(params?: ModulesListParams): Promise<PaginatedResponse<Module>> {
    const response = await apiClient.get<PaginatedResponse<Module>>(
      MODULES_API_URL,
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Get module by ID
   */
  async getById(id: number): Promise<Module> {
    const response = await apiClient.get<Module>(`${MODULES_API_URL}/${id}`);
    return response.data;
  },

  /**
   * Create new module
   */
  async create(data: CreateModuleData): Promise<Module> {
    const response = await apiClient.post<Module>(MODULES_API_URL, data);
    return response.data;
  },

  /**
   * Update module
   */
  async update(id: number, data: UpdateModuleData): Promise<Module> {
    const response = await apiClient.put<Module>(`${MODULES_API_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete module
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`${MODULES_API_URL}/${id}`);
  },
};

