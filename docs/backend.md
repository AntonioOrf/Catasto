# Backend Documentation - Catasto Fiorentino

The backend for the Catasto project is a modern **TypeScript** application built on **Node.js** and **Express**. It provides a robust API for querying historical data with advanced filtering and pagination.

## Architecture

The backend follows a **Controller-Service-Model** pattern, fully implemented in TypeScript to ensure data consistency and developer productivity.

### Directory Structure (`/backend-catasto/src`)

- **`server.ts`**: Entry point. Configures Express, global middlewares, and initializes the API routes.
- **`config/`**:
  - `db.ts`: MySQL pool configuration using environment variables.
- **`controllers/`**: Request handling logic.
  - `catasto.controller.ts`: Main logic for households, search, and IIIF manifest proxying.
  - `parenti.controller.ts`: Handles family member data.
  - `mestieri.controller.ts`: Handles professional categories.
- **`services/`**: Business logic layer.
  - `catasto.service.ts`: Complex query orchestration, filtering logic, and external API integrations (e.g., ICAR).
- **`models/`**: Direct database interaction.
  - `fuoco.model.ts`: Data access for household records.
  - `common.model.ts`: Shared data access for support tables.
- **`routes/`**: API route definitions.
- **`middlewares/`**: Global error handling and validation.
- **`utils/`**: Helper functions (e.g., SQL query builders).

## Development & Build

### Scripts

- `npm run dev`: Runs the server in development mode with `tsx watch`.
- `npm run build`: Compiles the project to `dist/` using `tsup`.
- `npm start`: Runs the compiled production server from `dist/server.js`.

## API Endpoints

### Catasto Data

- `GET /api/catasto`: Main search endpoint. Supports extensive query parameters for filtering and sorting.
- `GET /api/catasto/sidebar`: Optimized endpoint for the sidebar index.
- `GET /api/catasto/manifest/:id`: Proxy for the IIIF manifest from Archivio di Stato.

### Supporting Data

- `GET /api/parenti/:id`: Family members for a specific household ID.
- `GET /api/filters`: Dynamic options for the search panel (professions, locations, etc.).

## Database

The system interacts with a **MySQL** database. All queries are optimized using `mysql2/promise` and a dynamic query builder located in `src/utils/query-builder.ts`.

---

## Environment Variables

Required variables in `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=catasto
DB_PORT=3306
PORT=3001
```
