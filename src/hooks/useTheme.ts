import { useState } from 'react';

export function useTheme() {
  const [theme] = useState<'light' | 'dark' | 'purple'>('light');
  return { theme };
}
