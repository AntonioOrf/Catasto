import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function MappaPage() {
  // Placeholder Nodegoat Public Interface URL.
  // The user should replace this with their actual project's viewer URL later.
  const nodegoatUrl = "https://nodegoat.net/viewer.p/43"; // Example public Nodegoat map

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 w-full flex flex-col relative">
        <div className="bg-bg-dark border-b border-border-color p-4 md:px-8 shadow-sm flex items-center justify-between z-10">
          <h2 className="text-xl md:text-2xl font-bold text-primary">Esplorazione Geografica (Nodegoat)</h2>
          <span className="text-xs bg-item-selected text-text-inverted px-2 py-1 rounded">BETA</span>
        </div>

        {/* Nodegoat Iframe Container */}
        <div className="flex-1 w-full relative bg-gray-100 dark:bg-gray-900 border-none m-0 p-0 overflow-hidden">
             
          <iframe 
            src={nodegoatUrl}
            title="Mappa Catasto Nodegoat"
            className="absolute top-0 left-0 w-full h-full border-none m-0 p-0"
            allowFullScreen
          ></iframe>
        </div>
      </main>

      <Footer />
    </div>
  );
}
