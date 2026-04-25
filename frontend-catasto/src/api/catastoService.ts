import { API_URL, buildParams } from "./client";

export const fetchCatastoData = async (filters: any, page: number, limit: number) => {
  const params = buildParams(filters);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const response = await fetch(`${API_URL}/api/catasto?${params.toString()}`);
  if (!response.ok) throw new Error("Errore server");
  return await response.json();
};

export const fetchSidebarData = async (filters: any, page = 1, limit = 1000) => {
  const params = buildParams(filters);
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  const response = await fetch(
    `${API_URL}/api/catasto/sidebar?${params.toString()}`,
  );
  if (!response.ok) throw new Error("Errore sidebar");
  return await response.json();
};

export const fetchParentiData = async (idFuoco: number | null) => {
  if (!idFuoco) return [];
  const response = await fetch(`${API_URL}/api/parenti/${idFuoco}`);
  if (!response.ok) throw new Error("Errore parenti");
  return await response.json();
};

export const fetchFilterOptions = async () => {
  const response = await fetch(`${API_URL}/api/filters`);
  if (!response.ok) throw new Error("Errore caricamento filtri");
  return await response.json();
};
