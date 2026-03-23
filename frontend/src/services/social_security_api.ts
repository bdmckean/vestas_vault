import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type {
  SocialSecurity,
  SocialSecurityCreate,
  SocialSecurityProjectionsResponse,
  SocialSecurityUpdate,
} from '../types/social_security';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s so we don't hang on "Loading..." if backend is slow or down
});

export const socialSecurityApi = {
  get: async (): Promise<SocialSecurity | null> => {
    const response = await apiClient.get<SocialSecurity | null>('/social-security');
    return response.data;
  },

  create: async (data: SocialSecurityCreate): Promise<SocialSecurity> => {
    const response = await apiClient.post<SocialSecurity>('/social-security', data);
    return response.data;
  },

  update: async (data: SocialSecurityUpdate): Promise<SocialSecurity> => {
    const response = await apiClient.put<SocialSecurity>('/social-security', data);
    return response.data;
  },

  delete: async (): Promise<void> => {
    await apiClient.delete('/social-security');
  },

  getProjections: async (): Promise<SocialSecurityProjectionsResponse> => {
    const response = await apiClient.get<SocialSecurityProjectionsResponse>(
      '/social-security/projections'
    );
    return response.data;
  },
};
