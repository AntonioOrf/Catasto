import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import { FilterProvider } from './context/FilterContext';

// Lazy loaded pages (keeping original logic)
const MestieriPage = lazy(() => import('./pages/MestieriPage'));
const InfoPage = lazy(() => import('./pages/InfoPage'));
const MappaPage = lazy(() => import('./pages/MappaPage'));
const ContattiPage = lazy(() => import('./pages/ContattiPage'));

// Simple Spinner (placeholder for the original one)
const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
);

export default function App() {
  return (
    <FilterProvider>
      <Router>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-bg-main text-primary">
            <Spinner />
          </div>
        }>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/mestieri" element={<MestieriPage />} />
            <Route path="/informazioni" element={<InfoPage />} />
            <Route path="/mappa" element={<MappaPage />} />
            <Route path="/contatti" element={<ContattiPage />} />
          </Routes>
        </Suspense>
      </Router>
    </FilterProvider>
  );
}
