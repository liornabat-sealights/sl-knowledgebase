
import { useState, useMemo } from 'react';

interface UsePaginationResult<T> {
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  paginatedItems: T[];
  totalPages: number;
  showingFrom: number;
  showingTo: number;
}

/**
 * Hook to manage pagination
 */
export function usePagination<T>(items: T[]): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items.length, itemsPerPage]);
  
  // Ensure current page is valid after items or itemsPerPage changes
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);
  
  // Get paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);
  
  // Calculate showing from/to for display
  const showingFrom = useMemo(() => {
    return items.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  }, [items.length, currentPage, itemsPerPage]);
  
  const showingTo = useMemo(() => {
    return Math.min(currentPage * itemsPerPage, items.length);
  }, [currentPage, itemsPerPage, items.length]);
  
  return {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    paginatedItems,
    totalPages,
    showingFrom,
    showingTo,
  };
}
