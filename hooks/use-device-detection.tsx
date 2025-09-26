import { useState, useEffect } from 'react';
import { isMobileOrTabletDevice } from '@/lib/utils/printing';

/**
 * Custom hook for detecting mobile/tablet devices with responsive updates
 */
export function useDeviceDetection() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobileOrTablet(isMobileOrTabletDevice());
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return isMobileOrTablet;
}
