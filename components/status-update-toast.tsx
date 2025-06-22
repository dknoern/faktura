'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function StatusUpdateToast() {
  useEffect(() => {
    // Check for status update success message
    const statusUpdateSuccess = sessionStorage.getItem('statusUpdateSuccess');
    if (statusUpdateSuccess) {
      toast.success(statusUpdateSuccess);
      sessionStorage.removeItem('statusUpdateSuccess');
    }
  }, []);

  return null; // This component doesn't render anything
}
