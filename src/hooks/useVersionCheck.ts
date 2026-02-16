// Version check disabled - was causing infinite refresh loops in preview environment
// The preview has no build-version meta tag, so the check always detected a "mismatch"

export const useVersionCheck = (_intervalMs?: number) => {
  // No-op: disabled to prevent refresh loops
};

export const getBuildVersion = () => {
  try {
    // @ts-ignore - injected by Vite at build time
    return typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'dev';
  } catch {
    return 'dev';
  }
};
