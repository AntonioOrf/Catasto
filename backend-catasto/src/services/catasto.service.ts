import { FuocoModel } from "../models/fuoco.model.js";
import { CommonModel } from "../models/common.model.js";
import { buildQuery, buildOrderBy, QueryFilters } from "../utils/query-builder.js";
import { Fuoco, ApiResponse, PaginationInfo, SidebarItem, Parenti } from "@catasto/shared";

export class CatastoService {
  static async getAllFuochi(
    filters: QueryFilters,
    page: number = 1,
    limit: number = 50,
    sort_by: string = "nome",
    order: string = "ASC"
  ): Promise<ApiResponse<Fuoco[]>> {
    const offset = (page - 1) * limit;
    const { conditions, params, usedTables: queryTables } = buildQuery(filters);
    const { clause: orderByClause, usedTables: orderTables } = buildOrderBy(sort_by, order);

    const allUsedTables = new Set([...queryTables, ...orderTables]);

    const [total, data] = await Promise.all([
      FuocoModel.count(conditions, params, allUsedTables),
      FuocoModel.findAll(conditions, params, orderByClause, limit, offset)
    ]);

    const pagination: PaginationInfo = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return { data, pagination };
  }

  static async getSidebar(
    filters: QueryFilters,
    page: number = 1,
    limit: number = 1000,
    sort_by: string = "nome",
    order: string = "ASC"
  ): Promise<SidebarItem[]> {
    const offset = (page - 1) * limit;
    const { conditions, params } = buildQuery(filters);
    const { clause: orderByClause } = buildOrderBy(sort_by, order);

    return await FuocoModel.getSidebar(conditions, params, orderByClause, limit, offset);
  }

  static async getParenti(fuocoId: number): Promise<Parenti[]> {
    return await CommonModel.getParenti(fuocoId);
  }

  static async getMestieri(): Promise<any[]> {
    return await CommonModel.getMestieriList();
  }

  static async getManifest(id: string): Promise<any> {
    const targetUrl = `https://archiviodigitale-icar.cultura.gov.it/metadata/${id}/manifest.json?type=archive`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Archivio Icar error: ${response.status}`);
    }

    return await response.json();
  }
}
