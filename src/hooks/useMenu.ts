import { useCallback, useState } from 'react';

export function useMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = useCallback((open?: boolean) => {
    setIsOpen(prev => open !== undefined ? open : !prev);
  }, []);
  return { isOpen, toggleMenu };
}
