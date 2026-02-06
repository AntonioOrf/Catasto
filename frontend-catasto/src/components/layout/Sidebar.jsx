import React from "react";
import { List, ChevronLeft } from "lucide-react";

export default React.memo(function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarLoading,
  sidebarData,
  expandedId,
  targetScrolledId,
  handleSidebarClick,
}) {
  // Custom Virtualization Logic
  const containerRef = React.useRef(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    // Initial measure
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]); // Remeasure when sidebar opens

  const onScroll = (e) => setScrollTop(e.currentTarget.scrollTop);

  const ITEM_HEIGHT = 68;
  const totalHeight = sidebarData.length * ITEM_HEIGHT;

  // Render only visible items + buffer
  let startNode = Math.floor(scrollTop / ITEM_HEIGHT);
  let visibleNodeCount = Math.ceil(containerHeight / ITEM_HEIGHT);

  // Add buffer
  startNode = Math.max(0, startNode - 2);
  visibleNodeCount = Math.min(
    sidebarData.length - startNode,
    visibleNodeCount + 4,
  );

  const visibleItems = [];
  for (let i = 0; i < visibleNodeCount; i++) {
    const index = startNode + i;
    if (index >= sidebarData.length) break;

    const row = sidebarData[index];
    const isSelected = expandedId === row.id || targetScrolledId === row.id;

    visibleItems.push(
      <div
        key={`idx-${row.id}`}
        style={{
          position: "absolute",
          top: index * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
          width: "100%",
          padding: "2px 4px",
        }}
      >
        <button
          onClick={() => handleSidebarClick(row.id)}
          className={`
            w-full text-left p-2 rounded text-sm transition-colors h-full flex flex-col justify-center
            ${
              isSelected
                ? "bg-[var(--color-item-selected)] text-[var(--color-text-inverted)]"
                : "hover:bg-item-selected/90 text-text-main"
            }
          `}
        >
          <div className="font-bold truncate font-serif">{row.nome}</div>
          <div
            className={`text-xs truncate ${isSelected ? "text-[var(--color-text-symbols)]" : "text-gray-500"}`}
          >
            {row.mestiere || "Nessun mestiere"}
          </div>
        </button>
      </div>,
    );
  }

  return (
    <>
      {/* BACKDROP PER MOBILE */}
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-30 md:hidden backdrop-blur-[2px] transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR RESPONSIVE */}
      <aside
        className={`
          bg-bg-sidebar border-r border-border-base flex flex-col 
          transition-all duration-300 ease-in-out
          absolute top-0 left-0 bottom-0 z-30 shadow-2xl md:shadow-none md:static
          ${isSidebarOpen ? "w-[80%] sm:w-72 translate-x-0" : "w-0 -translate-x-full opacity-0 md:w-0"}
        `}
      >
        <div
          className="p-4 bg-bg-sidebar border-b border-border-base flex items-center justify-between whitespace-nowrap overflow-hidden flex-shrink-0"
          style={{ height: "60px" }}
        >
          <h3 className="font-bold text-text-main uppercase text-xs tracking-wider flex items-center gap-2">
            <List className="h-4 w-4 flex-shrink-0" /> Indice
          </h3>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-text-inverted hover:text-bg-header-border p-1"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto relative"
          ref={containerRef}
          onScroll={onScroll}
        >
          {sidebarLoading ? (
            <div className="p-4 text-center text-sm text-gray-500 italic">
              Caricamento indice...
            </div>
          ) : sidebarData.length > 0 ? (
            <div style={{ height: totalHeight, position: "relative" }}>
              {visibleItems}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-400">
              Nessun risultato.
            </div>
          )}
        </div>
      </aside>
    </>
  );
});
