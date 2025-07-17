import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ai-scan-processed-rows';

interface UseProcessedRowsReturn {
  processedRows: Set<string>;
  addProcessedRow: (id: string) => void;
  removeProcessedRow: (id: string) => void;
  resetProcessedRows: () => void;
  isProcessed: (id: string) => boolean;
}

export const useProcessedRows = (): UseProcessedRowsReturn => {
  const [processedRows, setProcessedRows] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        console.log('🔍 [useProcessedRows] Loading from localStorage...');
        const saved = localStorage.getItem(STORAGE_KEY);
        
        if (saved) {
          const parsed = JSON.parse(saved);
          const processedArray = Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
          const processedSet = new Set(processedArray);
          
          console.log('✅ [useProcessedRows] Loaded rows:', processedSet.size, 'items');
          setProcessedRows(processedSet);
        } else {
          console.log('ℹ️ [useProcessedRows] No saved data found');
        }
      } catch (error) {
        console.error('❌ [useProcessedRows] Failed to load from localStorage:', error);
        localStorage.removeItem(STORAGE_KEY);
        setProcessedRows(new Set());
      }
      setIsInitialized(true);
    };

    loadFromStorage();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) {
        console.log('🔄 [useProcessedRows] Storage changed in another tab');
        try {
          const parsed = JSON.parse(e.newValue);
          const processedArray = Array.isArray(parsed) ? parsed : [];
          setProcessedRows(new Set(processedArray));
        } catch (error) {
          console.error('❌ [useProcessedRows] Failed to parse storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to localStorage when processedRows changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    const saveToStorage = () => {
      try {
        const dataToSave = Array.from(processedRows);
        console.log('💾 [useProcessedRows] Saving to localStorage:', dataToSave.length, 'items');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('❌ [useProcessedRows] Failed to save to localStorage:', error);
      }
    };

    // Debounce saves to avoid too many writes
    const timeoutId = setTimeout(saveToStorage, 100);
    return () => clearTimeout(timeoutId);
  }, [processedRows, isInitialized]);

  const addProcessedRow = useCallback((id: string) => {
    console.log('➕ [useProcessedRows] Adding processed row:', id);
    setProcessedRows(prev => new Set([...prev, id]));
  }, []);

  const removeProcessedRow = useCallback((id: string) => {
    console.log('➖ [useProcessedRows] Removing processed row:', id);
    setProcessedRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const resetProcessedRows = useCallback(() => {
    console.log('🔄 [useProcessedRows] Resetting all processed rows');
    setProcessedRows(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('❌ [useProcessedRows] Failed to remove from localStorage:', error);
    }
  }, []);

  const isProcessed = useCallback((id: string) => {
    return processedRows.has(id);
  }, [processedRows]);

  return {
    processedRows,
    addProcessedRow,
    removeProcessedRow,
    resetProcessedRows,
    isProcessed
  };
};