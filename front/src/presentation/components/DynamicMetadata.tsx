'use client';

import { useEffect } from 'react';
import { getSiteSettings } from '@/lib/services/settingsService';

export default function DynamicMetadata() {
  useEffect(() => {
    const updateMetadata = async () => {
      const settings = await getSiteSettings();

      // 브라우저 탭 제목 업데이트
      document.title = settings.browserTitle;

      // 메타 설명 업데이트
      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta) {
        descriptionMeta.setAttribute('content', settings.browserDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = settings.browserDescription;
        document.head.appendChild(meta);
      }

      // 파비콘 업데이트
      if (settings.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.faviconUrl;
      }
    };

    updateMetadata();
  }, []);

  return null;
}
