'use client';

import { useMediaQuery } from './use-media-query';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType(): DeviceType {
  const isTabletOrLarger = useMediaQuery('(min-width: 48rem)', true);
  const isDesktop = useMediaQuery('(min-width: 64rem)', true);

  if (isDesktop) return 'desktop';
  if (isTabletOrLarger) return 'tablet';
  return 'mobile';
}
