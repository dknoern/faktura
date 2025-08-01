// Prevent multiple overrides during hot reloads
if (!(console as any).__timestamped) {
  // Override console.log to include timestamps
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = (...args: any[]) => {
    const timestamp = new Date().toISOString();
    originalLog(`[${timestamp}]`, ...args);
  };

  console.error = (...args: any[]) => {
    const timestamp = new Date().toISOString();
    originalError(`[${timestamp}]`, ...args);
  };

  console.warn = (...args: any[]) => {
    const timestamp = new Date().toISOString();
    originalWarn(`[${timestamp}]`, ...args);
  };

  console.info = (...args: any[]) => {
    const timestamp = new Date().toISOString();
    originalInfo(`[${timestamp}]`, ...args);
  };

  // Mark console as already timestamped
  (console as any).__timestamped = true;
}

export {}; // Make this a module
