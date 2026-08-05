'use client';

import { useEffect } from 'react';

import { useNearbyStores } from 'src/hooks/use-nearby-stores';

import { StoreList } from 'src/components/store/store-list';
import { EmptyState } from 'src/components/common/empty-state';
import { ErrorState } from 'src/components/common/error-state';
import { LoadingState } from 'src/components/common/loading-state';

// ----------------------------------------------------------------------

type NearbyContentProps = {
  initialProvince?: string;
};

export function NearbyContent({ initialProvince }: NearbyContentProps) {
  const {
    stores,
    isLoading,
    error,
    geolocationError,
    requestLocation,
    fallbackProvince,
    setFallbackProvince,
    refetch,
  } = useNearbyStores();

  useEffect(() => {
    if (initialProvince) {
      setFallbackProvince(initialProvince);
    } else {
      requestLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) return <LoadingState rows={4} />;

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />;
  }

  if (geolocationError && !fallbackProvince) {
    return <ErrorState message={geolocationError} onRetry={requestLocation} />;
  }

  if (!stores || stores.length === 0) {
    return (
      <EmptyState
        title="ยังไม่พบพิกัด Loveza ในพื้นที่นี้"
        description="ถ้าคุณเจอ สามารถช่วยแจ้งพิกัดให้คนอื่นได้"
        actionLabel="แจ้งพิกัดแรก"
        actionHref="/report"
      />
    );
  }

  return <StoreList stores={stores} />;
}
