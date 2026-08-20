export function getEnv(name: string, defaultValue?: string): string | undefined {
  // Client-side environment variables must be prefixed with VITE_
  const clientSideName = name.startsWith('VITE_') ? name : `VITE_${name}`;
  const value = import.meta.env[clientSideName] || process.env[name]; // Fallback for Node.js environments if needed
  if (value === undefined && defaultValue === undefined) {
    // console.warn(`Environment variable ${name} or ${clientSideName} is not set.`);
  }
  return value ?? defaultValue;
}
