# Graph Report - C:/Users/pachi/github/Catasto  (2026-07-26)

## Corpus Check
- Corpus is ~16,735 words - fits in a single context window. You may not need a graph.

## Summary
- 388 nodes · 481 edges · 38 communities (25 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.8)
- Token cost: 178,435 input · 0 output

## Community Hubs (Navigation)
- Backend Data Models
- Frontend Lint & Style Tooling
- Backend Controllers & Middleware
- Backend Package Config
- Frontend Package Dependencies
- Root Workspace Config
- IIIF Manuscript Viewer
- Frontend TS Config
- Backend Dev Tooling
- Backend TS Config
- Frontend Data Fetching & Sidebar
- Frontend App Shell & Filters
- Frontend Filter Input Components
- Docker & Project Docs
- Shared TS Base Config
- Frontend Layout & Static Pages
- Shared Package Config
- Shared TS Config
- Vite Node TS Config
- Frontend Table Component
- Spinner Component
- Filters Endpoint
- Parenti Endpoint
- Architecture Rationale
- Vite Branding
- Catasto App Branding
- Frontend Constants
- Vercel Deployment Config
- Theme Engine Rationale
- Local Dev Setup Rationale
- Book Icon Asset
- React Logo Asset

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 12 edges
2. `CatastoController` - 9 edges
3. `CatastoService` - 7 edges
4. `compilerOptions` - 7 edges
5. `useFilters()` - 7 edges
6. `Catasto Fiorentino 1427 project` - 7 edges
7. `CommonModel` - 6 edges
8. `HomePage()` - 6 edges
9. `compilerOptions` - 6 edges
10. `compilerOptions` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Installation & Deployment Guide (docs/guides.md)` --references--> `Catasto.sql schema import file`  [AMBIGUOUS]
  docs/guides.md → docker-compose.yml
- `Monorepo architecture` --semantically_similar_to--> `Multi-container Docker deployment architecture`  [INFERRED] [semantically similar]
  readme.md → docs/guides.md
- `Catasto Fiorentino 1427 project` --references--> `Backend Documentation (docs/backend.md)`  [EXTRACTED]
  readme.md → docs/backend.md
- `Catasto Fiorentino 1427 project` --references--> `Frontend Documentation (docs/frontend.md)`  [EXTRACTED]
  readme.md → docs/frontend.md
- `Catasto Fiorentino 1427 project` --references--> `IIIF manuscript viewer integration`  [EXTRACTED]
  readme.md → docs/frontend.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Controller-Service-Model Implementation** — backend_catasto_src_controllers_catasto_controller, backend_catasto_src_services_catasto_service, backend_catasto_src_models_fuoco_model, backend_catasto_src_models_common_model [INFERRED 0.85]
- **Catasto Multi-Container Docker Topology** — docker_compose_db, docker_compose_backend, docker_compose_frontend [EXTRACTED 1.00]
- **IIIF Manuscript Viewer Flow (Backend Proxy to Frontend Viewer)** — docs_backend_get_api_catasto_manifest, docs_frontend_iiif_integration, frontend_catasto_src_features_catasto_components_archivioviewermodal [INFERRED 0.85]

## Communities (38 total, 13 thin omitted)

### Community 0 - "Backend Data Models"
Cohesion: 0.13
Nodes (17): pool, FuocoModel, CatastoService, buildOrderBy(), buildQuery(), QueryFilters, ICAR external API integration, getFuochi() (+9 more)

### Community 1 - "Frontend Lint & Style Tooling"
Cohesion: 0.07
Nodes (29): autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, autoprefixer, eslint (+21 more)

### Community 2 - "Backend Controllers & Middleware"
Cohesion: 0.11
Nodes (11): CatastoController, FilterController, errorHandler(), CommonModel, router, router, router, router (+3 more)

### Community 3 - "Backend Package Config"
Cohesion: 0.08
Nodes (23): dependencies, @catasto/shared, compression, cors, dotenv, express, mysql2, zod (+15 more)

### Community 4 - "Frontend Package Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, dotenv, lucide-react, react, react-dom, react-router-dom, @tanstack/react-query, dotenv (+15 more)

### Community 5 - "Root Workspace Config"
Cohesion: 0.09
Nodes (22): concurrently, dependencies, dotenv, devDependencies, concurrently, postcss, tailwindcss, @tailwindcss/postcss (+14 more)

### Community 6 - "IIIF Manuscript Viewer"
Cohesion: 0.12
Nodes (13): GET /api/catasto/manifest/:id endpoint (IIIF manifest proxy), IIIF manuscript viewer integration, ArchivioViewerModal(), ArchivioViewerModalProps, getIiifImageUrl(), Page, SPLIT_VOLUMES, CatastoMobileCard (+5 more)

### Community 7 - "Frontend TS Config"
Cohesion: 0.11
Nodes (17): compilerOptions, baseUrl, jsx, lib, paths, types, extends, include (+9 more)

### Community 8 - "Backend Dev Tooling"
Cohesion: 0.12
Nodes (17): devDependencies, nodemon, tsup, tsx, @types/compression, @types/cors, @types/express, @types/node (+9 more)

### Community 9 - "Backend TS Config"
Cohesion: 0.12
Nodes (16): compilerOptions, ignoreDeprecations, module, moduleResolution, outDir, paths, rootDir, exclude (+8 more)

### Community 10 - "Frontend Data Fetching & Sidebar"
Cohesion: 0.30
Nodes (9): fetchCatastoData(), fetchFilterOptions(), fetchParentiData(), fetchSidebarData(), buildParams(), SidebarProps, useCatastoData(), useCatastoSidebar() (+1 more)

### Community 11 - "Frontend App Shell & Filters"
Cohesion: 0.18
Nodes (9): App(), ContattiPage, InfoPage, MappaPage, FilterContext, FilterProvider(), useCatastoFilters(), Providers() (+1 more)

### Community 12 - "Frontend Filter Input Components"
Cohesion: 0.17
Nodes (10): CustomAutocomplete(), CustomAutocompleteProps, Option, CustomNumberInput(), CustomNumberInputProps, CustomSelect(), CustomSelectProps, useFilters() (+2 more)

### Community 13 - "Docker & Project Docs"
Cohesion: 0.20
Nodes (14): docker-compose backend service, docker-compose db service (MySQL), docker-compose frontend service, Backend Documentation (docs/backend.md), Frontend Documentation (docs/frontend.md), Installation & Deployment Guide (docs/guides.md), Multi-container Docker deployment architecture, index.html #root mount div (+6 more)

### Community 14 - "Shared TS Base Config"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noFallthroughCasesInSwitch, noUnusedLocals (+4 more)

### Community 15 - "Frontend Layout & Static Pages"
Cohesion: 0.27
Nodes (3): Footer(), Header(), useDarkMode()

### Community 16 - "Shared Package Config"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, build (+3 more)

### Community 17 - "Shared TS Config"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, outDir, rootDir, extends, include, src/**/* (+1 more)

### Community 18 - "Vite Node TS Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include, vite.config.js

## Ambiguous Edges - Review These
- `Catasto.sql schema import file` → `Installation & Deployment Guide (docs/guides.md)`  [AMBIGUOUS]
  docs/guides.md · relation: references

## Knowledge Gaps
- **156 isolated node(s):** `name`, `version`, `main`, `type`, `dev` (+151 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Catasto.sql schema import file` and `Installation & Deployment Guide (docs/guides.md)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `IIIF manuscript viewer integration` connect `IIIF Manuscript Viewer` to `Docker & Project Docs`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Why does `GET /api/catasto/manifest/:id endpoint (IIIF manifest proxy)` connect `IIIF Manuscript Viewer` to `Backend Controllers & Middleware`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **What connects `name`, `version`, `main` to the rest of the system?**
  _156 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Data Models` be split into smaller, more focused modules?**
  _Cohesion score 0.13368983957219252 - nodes in this community are weakly interconnected._
- **Should `Frontend Lint & Style Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Backend Controllers & Middleware` be split into smaller, more focused modules?**
  _Cohesion score 0.10846560846560846 - nodes in this community are weakly interconnected._