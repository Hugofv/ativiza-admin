/**
 * Accounts Service
 */

import apiClient from '../client';
import { PaginatedResponse } from '../types';

export interface Account {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  status: 'ACTIVE' | 'INACTIVE';
  currency: 'BRL' | 'USD' | 'EUR' | 'GBP';
  planId?: number;
  ownerId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAccountData {
  name: string;
  email: string;
  phone?: string;
  document?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP';
  planId?: number;
  ownerId?: number;
  password?: string;
}

export interface UpdateAccountData {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP';
  planId?: number;
}

export interface AccountsListParams {
  page?: number;
  limit?: number;
  q?: string;
  ownerId?: number;
}

export const accountsService = {
  /**
   * Get all accounts
   */
  async getAll(params?: AccountsListParams): Promise<PaginatedResponse<Account>> {
    const response = await apiClient.get<PaginatedResponse<Account>>('/api/accounts', {
      params,
    });
    return response.data;
  },

  /**
   * Get account by ID
   */
  async getById(id: string): Promise<Account> {
    const response = await apiClient.get<Account>(`/api/accounts/${id}`);
    return response.data;
  },

  /**
   * Create new account
   */
  async create(data: CreateAccountData): Promise<Account> {
    const response = await apiClient.post<Account>('/api/accounts', data);
    return response.data;
  },

  /**
   * Update account
   */
  async update(id: string, data: UpdateAccountData): Promise<Account> {
    const response = await apiClient.put<Account>(`/api/accounts/${id}`, data);
    return response.data;
  },

  /**
   * Delete account
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/accounts/${id}`);
  },
};

