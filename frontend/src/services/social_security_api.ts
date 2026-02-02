import axios from 'axios';
import type {
  SocialSecurity,
  SocialSecurityCreate,
  SocialSecurityPaymentProjection,
  SocialSecurityUpdate,
} from '../types/social_security';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
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

  getProjections: async (): Promise<SocialSecurityPaymentProjection[]> => {
    const response = await apiClient.get<SocialSecurityPaymentProjection[]>('/social-security/projections');
    return response.data;
  },
};
