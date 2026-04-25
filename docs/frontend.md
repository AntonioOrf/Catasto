# Frontend Documentation - Catasto Fiorentino

The frontend is a high-performance **React** application built with **TypeScript** and **Vite**. It features a modern, responsive interface designed for historical data exploration.

## Design System & Styling

The project uses **Tailwind CSS v4**, which emphasizes a CSS Variable-based theme system.

### Theme Engine

Colors and spacings are managed globally in `src/index.css`. This allows for seamless switching between:

- **Light Mode**: A clean, paper-like "Renaissance" aesthetic.
- **Dark Mode**: A deep "Blue Archive" theme optimized for readability in low light.

### Visual Excellence

- **Rich Aesthetics**: Custom HSL color palettes and smooth transitions.
- **Typography**: Focused on readability with Serif fonts for historical data and Sans-serif for UI elements.
- **Micro-animations**: Subtle interactions using Tailwind's transition utilities.

## Architecture

The frontend follows a feature-based structure to ensure scalability.

### Directory Structure (`/frontend-catasto/src`)

- **`features/catasto/`**: Core logic for the Catasto application.
  - `components/`: UI elements like `CatastoTable`, `FilterPanel`, and `ArchivioViewerModal`.
  - `api/`: Feature-specific API clients.
- **`components/`**:
  - `layout/`: Global elements like `Header`, `Footer`, and `Sidebar`.
  - `common/`: Reusable UI primitives like `Spinner`, `CustomSelect`, and `CustomNumberInput`.
- **`hooks/`**: Custom React hooks for data fetching (`useCatastoData`) and sidebar state.
- **`context/`**: Global state management using React Context API (e.g., `FilterContext`).
- **`providers/`**: Context providers wrapper.
- **`pages/`**: Main route components (Home, Map, Profession analysis).

## Key Technologies

- **React 18**: Utilizing `Suspense` and `lazy` for route-level code splitting.
- **TypeScript**: Full type safety across components and API responses.
- **Lucide React**: Vector icons for a modern feel.
- **IIIF Integration**: Custom logic for viewing digitized archival manuscripts.

## Development Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Generates the production bundle in `dist/`.
- `npm run lint`: Performs static analysis check.

---

## API Interaction

Data fetching is centralized in `src/api/` and feature-specific `api/` folders. It uses the native `fetch` API wrapped in custom hooks to handle loading states and error reporting.
