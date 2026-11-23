'use client';

import { useEffect } from 'react';

import { supabase } from 'src/lib/supabase';

const deviceKey = 'loveza-product-view-device';
const deviceIdPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const recordView = () => {
      let deviceId: string;
      try {
        const storedId = localStorage.getItem(deviceKey);
        deviceId = storedId && deviceIdPattern.test(storedId) ? storedId : crypto.randomUUID();
        if (deviceId !== storedId) localStorage.setItem(deviceKey, deviceId);
      } catch {
        return;
      }

      void supabase.rpc('record_product_view', {
        target_product_id: productId,
        viewer_device_id: deviceId,
      });
    };

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', onVisible);
      recordView();
    };
    document.addEventListener('visibilitychange', onVisible);
    onVisible();
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [productId]);

  return null;
}
