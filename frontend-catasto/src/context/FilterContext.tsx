import React, { createContext, useContext } from 'react';
import { useCatastoFilters, type FiltersState } from '../hooks/useCatastoFilters';

const FilterContext = createContext<FiltersState | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const filters = useCatastoFilters();

  return (
    <FilterContext.Provider value={filters}>
      {children}
    </FilterContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider, common pattern
export const useFilters = (): FiltersState => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
