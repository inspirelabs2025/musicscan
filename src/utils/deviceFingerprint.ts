/**
 * Generate a simple device fingerprint based on browser properties.
 * Not cryptographically strong, but effective against casual abuse.
 */
export function getDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
  ];
  
  const raw = components.join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  
  return 'fp_' + Math.abs(hash).toString(36);
}
