import { useMutation, useQuery, useQueryClient } from 'react-query';
import { socialSecurityApi } from '../services/social_security_api';
import type {
  SocialSecurity,
  SocialSecurityCreate,
  SocialSecurityPaymentProjection,
  SocialSecurityUpdate,
} from '../types/social_security';

export function useSocialSecurity() {
  return useQuery<SocialSecurity | null, Error>('social-security', socialSecurityApi.get);
}

export function useSocialSecurityProjections() {
  const { data: ss } = useSocialSecurity();
  return useQuery<SocialSecurityPaymentProjection[], Error>(
    'social-security-projections',
    socialSecurityApi.getProjections,
    {
      enabled: !!ss, // Only fetch when SS is configured
    }
  );
}

export function useCreateSocialSecurity() {
  const queryClient = useQueryClient();
  return useMutation<SocialSecurity, Error, SocialSecurityCreate>(
    (data) => socialSecurityApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('social-security');
        queryClient.invalidateQueries('social-security-projections');
      },
    }
  );
}

export function useUpdateSocialSecurity() {
  const queryClient = useQueryClient();
  return useMutation<SocialSecurity, Error, SocialSecurityUpdate>(
    (data) => socialSecurityApi.update(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('social-security');
        queryClient.invalidateQueries('social-security-projections');
      },
    }
  );
}

export function useDeleteSocialSecurity() {
  const queryClient = useQueryClient();
  return useMutation<void, Error>(
    () => socialSecurityApi.delete(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('social-security');
        queryClient.invalidateQueries('social-security-projections');
      },
    }
  );
}
