import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Fuoco, ApiResponse } from "@catasto/shared";

export const getFuochi = (params: Record<string, string>): Promise<ApiResponse<Fuoco[]>> => {
  return apiClient.get<ApiResponse<Fuoco[]>>("/catasto", params);
};

export const useFuochi = (params: Record<string, string>) => {
  return useQuery({
    queryKey: ["fuochi", params],
    queryFn: () => getFuochi(params),
  });
};
