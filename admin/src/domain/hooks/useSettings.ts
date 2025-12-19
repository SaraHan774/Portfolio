/**
 * Settings Domain Hook - 사이트 설정 관련 비즈니스 로직
 * Repository 레이어를 통해 데이터 접근
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSiteSettings,
  updateSiteSettings,
  uploadFavicon,
  deleteFavicon,
  settingsCacheKeys,
  settingsCacheConfig,
} from '../../data/repository';
import type { SiteSettings } from '../../core/types';

/**
 * 사이트 설정 조회
 */
export const useSiteSettings = () => {
  return useQuery({
    queryKey: settingsCacheKeys.site(),
    queryFn: getSiteSettings,
    ...settingsCacheConfig,
  });
};

/**
 * 사이트 설정 업데이트
 */
export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Omit<SiteSettings, 'id' | 'updatedAt'>>) =>
      updateSiteSettings(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsCacheKeys.site(), data);
    },
  });
};

/**
 * 파비콘 업로드
 */
export const useUploadFavicon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadFavicon,
    onSuccess: (faviconUrl) => {
      // 캐시된 설정에 새 파비콘 URL 반영
      queryClient.setQueryData<SiteSettings | undefined>(
        settingsCacheKeys.site(),
        (old) => (old ? { ...old, faviconUrl } : old)
      );
    },
  });
};

/**
 * 파비콘 삭제
 */
export const useDeleteFavicon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFavicon,
    onSuccess: () => {
      // 캐시된 설정에서 파비콘 URL 제거
      queryClient.setQueryData<SiteSettings | undefined>(
        settingsCacheKeys.site(),
        (old) => (old ? { ...old, faviconUrl: undefined } : old)
      );
    },
  });
};

/**
 * 브라우저 타이틀 업데이트 (편의 훅)
 */
export const useUpdateBrowserTitle = () => {
  const { mutateAsync } = useUpdateSiteSettings();

  return useMutation({
    mutationFn: (browserTitle: string) => mutateAsync({ browserTitle }),
  });
};

/**
 * 푸터 텍스트 업데이트 (편의 훅)
 */
export const useUpdateFooterText = () => {
  const { mutateAsync } = useUpdateSiteSettings();

  return useMutation({
    mutationFn: (footerText: string) => mutateAsync({ footerText }),
  });
};
