import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function ContattiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10">
        <h2 className="text-3xl font-bold mb-6 text-primary">Contatti</h2>
        <div className="bg-bg-sidebar border border-border-base rounded-lg p-8 shadow-lg">
          <p className="mb-6 leading-relaxed text-lg">
            Per informazioni sul progetto, segnalazioni o collaborazioni, potete contattare il team tramite i seguenti canali:
          </p>
          
          <div className="space-y-6">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-text-accent font-bold mb-1">Email</span>
              <a href="mailto:info@catastofiorentino.it" className="text-primary text-xl hover:underline">
                info@catastofiorentino.it
              </a>
            </div>

            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-text-accent font-bold mb-1">GitHub</span>
              <a href="https://github.com/AntonioOrf/Catasto" target="_blank" rel="noopener noreferrer" className="text-primary text-xl hover:underline">
                github.com/AntonioOrf/Catasto
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
