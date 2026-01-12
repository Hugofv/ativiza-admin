/**
 * Platform Users Service
 */

import apiClient from '../client';
import { PaginatedResponse } from '../types';

export interface PlatformUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
  isActive: boolean;
  twoFa?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface CreatePlatformUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'owner' | 'admin' | 'agent' | 'viewer';
  isActive?: boolean;
  twoFa?: boolean;
}

export interface UpdatePlatformUserData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: 'owner' | 'admin' | 'agent' | 'viewer';
  isActive?: boolean;
  twoFa?: boolean;
}

export interface PlatformUsersListParams {
  page?: number;
  limit?: number;
  role?: 'owner' | 'admin' | 'agent' | 'viewer';
  isActive?: boolean;
  q?: string;
}

export const platformUsersService = {
  /**
   * Get all platform users
   */
  async getAll(params?: PlatformUsersListParams): Promise<PaginatedResponse<PlatformUser>> {
    const response = await apiClient.get<PaginatedResponse<PlatformUser>>(
      '/api/platform-users',
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Get platform user by ID
   */
  async getById(id: number): Promise<PlatformUser> {
    const response = await apiClient.get<PlatformUser>(`/api/platform-users/${id}`);
    return response.data;
  },

  /**
   * Create new platform user
   */
  async create(data: CreatePlatformUserData): Promise<PlatformUser> {
    const response = await apiClient.post<PlatformUser>('/api/platform-users', data);
    return response.data;
  },

  /**
   * Update platform user
   */
  async update(id: number, data: UpdatePlatformUserData): Promise<PlatformUser> {
    const response = await apiClient.put<PlatformUser>(`/api/platform-users/${id}`, data);
    return response.data;
  },

  /**
   * Delete platform user
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/platform-users/${id}`);
  },
};

