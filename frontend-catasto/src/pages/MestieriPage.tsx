import React, { useEffect, useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { API_URL } from '../api/client';

export default function MestieriPage() {
  const [mestieri, setMestieri] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/mestieri`)
      .then(res => {
        if (!res.ok) throw new Error("Errore nel caricamento dei mestieri");
        return res.json();
      })
      .then(data => {
        setMestieri(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-text-main font-serif">
      <Header showHomeLink={true} />

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10">
        <h2 className="text-3xl font-bold mb-6 text-primary">Elenco dei Mestieri</h2>
        
        {loading && <p className="text-text-accent">Caricamento in corso...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <div className="bg-bg-sidebar border border-border-base rounded-lg overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-text-accent border-b border-border-base text-sm uppercase">
                <tr>
                  <th className="p-4 w-1/3">Mestiere</th>
                  <th className="p-4 w-2/3">Descrizione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-base text-sm">
                {mestieri.map((m) => (
                  <tr key={m.id || m.ID_Mestiere || m.Mestiere} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold capitalize">{m.Mestiere}</td>
                    <td className="p-4 text-text-accent">
                      {m.Descrizione || m.descrizione || "Nessuna descrizione disponibile per il momento."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
