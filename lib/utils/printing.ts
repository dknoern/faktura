/**
 * Shared printing utilities for handling device-aware printing across the application
 */

/**
 * Detects if the current device is a mobile device or tablet (including iPad)
 */
export function isMobileOrTabletDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Consider it mobile/tablet if it's a mobile device OR a touch device with smaller screen
  return isMobileDevice || (isTouchDevice && window.innerWidth <= 1024);
}

// Track active print operations to prevent multiple simultaneous prints
let activePrintOperation = false;

/**
 * Handles printing with device-aware strategy
 * @param printUrl - The URL of the print page
 * @param fallbackUrl - Optional fallback URL if print fails
 */
export function handleDeviceAwarePrint(printUrl: string, fallbackUrl?: string): void {
  // Prevent multiple simultaneous print operations
  if (activePrintOperation) {
    console.debug('Print operation already in progress, ignoring request');
    return;
  }

  // For mobile/tablet devices (including iPad), directly open in new tab
  // as iframe printing is unreliable on these devices
  if (isMobileOrTabletDevice()) {
    const printWindow = window.open(printUrl, '_blank');
    if (printWindow) {
      // Focus the new window to ensure user is on the print page
      printWindow.focus();
      // Add a small delay to ensure content loads before showing print dialog
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }
    return;
  }

  // Set flag to prevent multiple operations
  activePrintOperation = true;

  // For desktop devices, use hidden iframe approach
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  
  // Add unique identifier for tracking
  iframe.id = `print-iframe-${Date.now()}`;
  
  document.body.appendChild(iframe);
  
  const cleanup = () => {
    try {
      if (iframe && iframe.parentNode && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    } catch (error) {
      // Ignore cleanup errors - iframe may have already been removed
      console.debug('Iframe cleanup error (safe to ignore):', error);
    } finally {
      // Reset flag to allow future print operations
      activePrintOperation = false;
    }
  };
  
  iframe.onload = () => {
    // Wait a moment for content to fully load, then print
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (error) {
        console.error('Print failed:', error);
        // Fallback to opening in new tab if iframe printing fails
        const fallback = fallbackUrl || printUrl;
        window.open(fallback, '_blank');
      }
      
      // Clean up iframe after printing
      setTimeout(cleanup, 1000);
    }, 500);
  };
  
  // Handle iframe load errors
  iframe.onerror = () => {
    console.error('Failed to load print content');
    cleanup();
    // Fallback to opening in new tab
    const fallback = fallbackUrl || printUrl;
    window.open(fallback, '_blank');
  };
  
  iframe.src = printUrl;
}

/**
 * Generates the auto-print JavaScript for print pages
 */
export function generateAutoPrintScript(): string {
  return `
    // Auto-print functionality that works better on mobile devices
    window.addEventListener('load', function() {
      // Don't auto-print if we're in an iframe (desktop printing uses iframe)
      if (window.parent !== window) {
        return;
      }
      
      // Small delay to ensure content is fully rendered
      setTimeout(function() {
        // Check if this is likely a mobile/tablet device
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
        
        if (isMobileDevice) {
          // On mobile devices, just trigger print - user will need to manually select print
          window.print();
        } else {
          // On desktop, print should work normally
          window.print();
        }
      }, 500);
    });
  `;
}
