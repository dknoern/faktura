'use client';

import { useEffect, useState } from 'react';

export function TestInstanceIndicator() {
  const [isTestInstance, setIsTestInstance] = useState(false);

  useEffect(() => {
    // Check if we're on localhost or a test instance
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('localhost') || hostname.includes('test')) {
      setIsTestInstance(true);
    }
  }, []);

  if (!isTestInstance) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-2 z-50"
      style={{
        background: 'repeating-linear-gradient(45deg, #f97316, #f97316 10px, #374151 10px, #374151 20px)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      title="Test Instance - Not Production"
    >
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-b-md shadow-lg">
        TEST ENVIRONMENT
      </div>
    </div>
  );
}
