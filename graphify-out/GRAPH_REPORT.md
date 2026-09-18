# Graph Report - Catasto  (2026-09-18)

## Corpus Check
- 89 files · ~27,444 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 634 nodes · 953 edges · 37 communities (31 shown, 6 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 84 edges (avg confidence: 0.99)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `514b9054`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- Form Input Components
- DB Connectivity Check Script
- Filters Endpoint
- Parenti Endpoint
- Vite Branding
- Frontend Constants
- Vercel Deployment Config
- PostCSS Config File
- Book Icon Asset
- SegnalazioneModel

## God Nodes (most connected - your core abstractions)
1. `QueryGroup` - 14 edges
2. `compilerOptions` - 12 edges
3. `CatastoController` - 10 edges
4. `SegnalazioneModel` - 10 edges
5. `compileCondition()` - 9 edges
6. `getField()` - 9 edges
7. `CatastoService` - 8 edges
8. `useCatastoFilters()` - 8 edges
9. `scripts` - 7 edges
10. `compilerOptions` - 7 edges

## Surprising Connections (you probably didn't know these)
- `compileCondition()` --calls--> `getField()`  [EXTRACTED]
  backend-catasto/src/utils/query-ast-builder.ts → packages/shared/src/fields.ts
- `CatastoRowProps` --references--> `TipoSegnalazione`  [EXTRACTED]
  frontend-catasto/src/features/catasto/components/CatastoRow.tsx → packages/shared/src/segnalazioni.ts
- `SegnalazioneModalProps` --references--> `TipoSegnalazione`  [EXTRACTED]
  frontend-catasto/src/features/segnalazioni/components/SegnalazioneModal.tsx → packages/shared/src/segnalazioni.ts
- `assertAstLimits()` --calls--> `astDepth()`  [EXTRACTED]
  backend-catasto/src/utils/query-ast-builder.ts → packages/shared/src/query-ast.ts
- `assertAstLimits()` --calls--> `countConditions()`  [EXTRACTED]
  backend-catasto/src/utils/query-ast-builder.ts → packages/shared/src/query-ast.ts

## Import Cycles
- None detected.

## Communities (37 total, 6 thin omitted)

### Community 0 - "Backend Data Models"
Cohesion: 0.09
Nodes (23): pool, FilterController, CommonModel, FuocoModel, SegnalazioneRow, router, migrate(), MIGRATIONS_DIR (+15 more)

### Community 1 - "Frontend Lint & Style Tooling"
Cohesion: 0.08
Nodes (27): fetchCatastoAuto(), fetchCatastoData(), fetchCatastoQuery(), fetchFilterOptions(), fetchParentiData(), fetchSidebarAuto(), fetchSidebarData(), parseError() (+19 more)

### Community 2 - "Backend Controllers & Middleware"
Cohesion: 0.06
Nodes (31): autoprefixer, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks (+23 more)

### Community 3 - "Backend Package Config"
Cohesion: 0.06
Nodes (30): concurrently, dependencies, dotenv, devDependencies, concurrently, postcss, tailwindcss, @tailwindcss/postcss (+22 more)

### Community 4 - "Frontend Package Dependencies"
Cohesion: 0.07
Nodes (28): devDependencies, tsup, tsx, @types/compression, @types/cors, @types/express, @types/node, typescript (+20 more)

### Community 5 - "Root Workspace Config"
Cohesion: 0.09
Nodes (22): dependencies, lucide-react, react, react-dom, react-router-dom, @tanstack/react-query, name, private (+14 more)

### Community 6 - "IIIF Manuscript Viewer"
Cohesion: 0.11
Nodes (20): Archivio di Stato di Firenze, Backend API, Backend Documentation, Backend Models, Backend package.json, Backend Routes, Backend Services, Compression Middleware (+12 more)

### Community 7 - "Frontend TS Config"
Cohesion: 0.11
Nodes (19): dependencies, @catasto/shared, compression, cors, dotenv, express, express-rate-limit, helmet (+11 more)

### Community 8 - "Backend Dev Tooling"
Cohesion: 0.11
Nodes (19): Dark Mode Support, Feature-Based Frontend Structure, Frontend Application, Frontend Catasto Components, Frontend Common Components, Frontend Context API, Frontend Custom Hooks, Frontend Documentation (+11 more)

### Community 9 - "Backend TS Config"
Cohesion: 0.08
Nodes (25): ArchivioViewerModal(), ArchivioViewerModalProps, getIiifImageUrl(), Page, SPLIT_VOLUMES, CatastoMobileCard, CatastoRow, CatastoRowProps (+17 more)

### Community 10 - "Frontend Data Fetching & Sidebar"
Cohesion: 0.11
Nodes (17): compilerOptions, baseUrl, jsx, lib, paths, types, extends, include (+9 more)

### Community 11 - "Frontend App Shell & Filters"
Cohesion: 0.12
Nodes (16): compilerOptions, ignoreDeprecations, module, moduleResolution, outDir, paths, rootDir, exclude (+8 more)

### Community 12 - "Frontend Filter Input Components"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, module, moduleResolution, noFallthroughCasesInSwitch, noUnusedLocals (+4 more)

### Community 13 - "Docker & Project Docs"
Cohesion: 0.27
Nodes (3): Footer(), Header(), useDarkMode()

### Community 14 - "Shared TS Base Config"
Cohesion: 0.17
Nodes (11): devDependencies, typescript, typescript, main, name, private, scripts, build (+3 more)

### Community 15 - "Frontend Layout & Static Pages"
Cohesion: 0.27
Nodes (10): Backend Dockerfile, Docker & Docker Compose, Docker Deployment Setup, Frontend Dockerfile, Installation and Deployment Guide, Local Development Setup, Multi-Stage Docker Build Pattern, MySQL 8.0 (+2 more)

### Community 16 - "Shared Package Config"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, outDir, rootDir, extends, include, src/**/* (+1 more)

### Community 17 - "Shared TS Config"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include, vite.config.js

### Community 19 - "Frontend Table Component"
Cohesion: 0.05
Nodes (40): API Endpoints, Architecture, Backend Documentation - Catasto Fiorentino, Catasto Data, Database, Development & Build, Directory Structure (`/backend-catasto/src`), Environment Variables (+32 more)

### Community 20 - "Spinner Component"
Cohesion: 0.29
Nodes (7): ACRH Digitization Project, Catasto Fiorentino 1427, CLAUDE.md Instructions, Klapisch-Zuber Research, MVC/CSM Architectural Pattern, Project README, Type Safety Strategy

### Community 21 - "Form Input Components"
Cohesion: 0.33
Nodes (6): GET /api/catasto, GET /api/filters, GET /api/catasto/manifest/:id, GET /api/parenti/:id, GET /api/catasto/sidebar, Backend Controllers

### Community 22 - "DB Connectivity Check Script"
Cohesion: 0.40
Nodes (5): @catasto/shared Package, CI/CD Workflow, Monorepo Workspace Structure, NPM Development Scripts, Root package.json

### Community 34 - "PostCSS Config File"
Cohesion: 0.06
Nodes (35): advancedQuerySchema, CatastoController, createSchema, updateSchema, requireAdmin(), safeCompare(), errorHandler(), router (+27 more)

### Community 35 - "Book Icon Asset"
Cohesion: 0.07
Nodes (53): assertAstLimits(), FilterContext, FilterProvider(), AdvancedSearchPanel(), AdvancedSearchPanelProps, ConditionEditor(), ConditionEditorProps, GroupEditor() (+45 more)

### Community 36 - "SegnalazioneModel"
Cohesion: 0.18
Nodes (5): SegnalazioneController, SegnalazioneModel, SegnalazioneService, Segnalazione, StatoSegnalazione

## Knowledge Gaps
- **201 isolated node(s):** `name`, `version`, `main`, `type`, `dev` (+196 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CatastoTable()` connect `Root Workspace Config` to `Backend TS Config`, `Frontend Lint & Style Tooling`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 28 inferred relationships involving `Backend API` (e.g. with `Advanced Search Feature` and `Archivio di Stato di Firenze`) actually correct?**
  _`Backend API` has 28 INFERRED edges - model-reasoned connections that need verification._
- **Are the 27 inferred relationships involving `Frontend Application` (e.g. with `docker-compose.yml` and `Advanced Search Feature`) actually correct?**
  _`Frontend Application` has 27 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `main` to the rest of the system?**
  _201 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Data Models` be split into smaller, more focused modules?**
  _Cohesion score 0.08734693877551021 - nodes in this community are weakly interconnected._
- **Should `Frontend Lint & Style Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.08362369337979095 - nodes in this community are weakly interconnected._
- **Should `Backend Controllers & Middleware` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._