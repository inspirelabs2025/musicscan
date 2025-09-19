import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface FilterState {
  search: string;
  category: string;
  dateRange: string;
  source: string;
  genre: string;
  year: string;
  sortBy: string;
  viewMode: string;
}

export function useUrlFilters(initialFilters: Partial<FilterState> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getFilterFromUrl = (key: string, defaultValue: string) => {
    return searchParams.get(key) || defaultValue;
  };

  const [filters, setFilters] = useState<FilterState>({
    search: getFilterFromUrl('q', ''),
    category: getFilterFromUrl('category', 'all'),
    dateRange: getFilterFromUrl('dateRange', 'all'),
    source: getFilterFromUrl('source', 'all'),
    genre: getFilterFromUrl('genre', 'all'),
    year: getFilterFromUrl('year', 'all'),
    sortBy: getFilterFromUrl('sortBy', 'date'),
    viewMode: getFilterFromUrl('view', 'grid'),
    ...initialFilters
  });

  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== '') {
      newParams.set(key === 'search' ? 'q' : key, value);
    } else {
      newParams.delete(key === 'search' ? 'q' : key);
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      dateRange: 'all',
      source: 'all',
      genre: 'all',
      year: 'all',
      sortBy: 'date',
      viewMode: 'grid'
    });
    setSearchParams({});
  }, [setSearchParams]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category !== 'all') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.source !== 'all') count++;
    if (filters.genre !== 'all') count++;
    if (filters.year !== 'all') count++;
    return count;
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    activeFilterCount: getActiveFilterCount()
  };
}