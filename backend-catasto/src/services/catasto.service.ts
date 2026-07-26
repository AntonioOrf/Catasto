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
    const { conditions, params, usedTables: queryTables } = buildQuery(filters);
    const { clause: orderByClause, usedTables: orderTables } = buildOrderBy(sort_by, order);
    const allUsedTables = new Set([...queryTables, ...orderTables]);

    return await FuocoModel.getSidebar(conditions, params, orderByClause, limit, offset, allUsedTables);
  }

  static async getParenti(fuocoId: number): Promise<Parenti[]> {
    return await CommonModel.getParenti(fuocoId);
  }

  static async getMestieri(): Promise<any[]> {
    return await CommonModel.getMestieriList();
  }

  // Manifests describe already-digitized historical volumes and never change,
  // so caching them avoids re-hitting the upstream government service on
  // every page load of the viewer.
  private static manifestCache = new Map<string, { data: any; expiresAt: number }>();
  private static readonly MANIFEST_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  static async getManifest(id: string): Promise<any> {
    const cached = this.manifestCache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const targetUrl = `https://archiviodigitale-icar.cultura.gov.it/metadata/${id}/manifest.json?type=archive`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Archivio Icar error: ${response.status}`);
    }

    const data = await response.json();
    this.manifestCache.set(id, { data, expiresAt: Date.now() + this.MANIFEST_CACHE_TTL_MS });
    return data;
  }
}
