'use client';

import { useEffect, useState } from 'react';

export function useIsScrolled(threshold = 0) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateIsScrolled = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    updateIsScrolled();
    window.addEventListener('scroll', updateIsScrolled, { passive: true });

    return () => window.removeEventListener('scroll', updateIsScrolled);
  }, [threshold]);

  return isScrolled;
}
