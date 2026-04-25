import React, { createContext, useContext } from 'react';
import { useCatastoFilters } from '../hooks/useCatastoFilters';

const FilterContext = createContext<any>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const filters = useCatastoFilters();

  return (
    <FilterContext.Provider value={filters}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
