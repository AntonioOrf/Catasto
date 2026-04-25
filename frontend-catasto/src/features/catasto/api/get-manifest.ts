import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const getManifest = (id: string): Promise<any> => {
  return apiClient.get<any>(`/catasto/manifest/${id}`);
};

export const useManifest = (id: string | null) => {
  return useQuery({
    queryKey: ["manifest", id],
    queryFn: () => getManifest(id!),
    enabled: !!id,
  });
};
