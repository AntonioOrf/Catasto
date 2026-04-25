import React, { useRef, useState, useEffect } from "react";
import { List, ChevronLeft } from "lucide-react";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  sidebarLoading: boolean;
  sidebarData: any[];
  expandedId: number | null;
  targetScrolledId: string | null;
  handleSidebarClick: (id: any) => void;
  loadMoreSidebar: () => void;
  hasMore: boolean;
}

export default React.memo(function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarLoading,
  sidebarData,
  expandedId,
  targetScrolledId,
  handleSidebarClick,
  loadMoreSidebar,
  hasMore,
}: SidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

  useEffect(() => {
    if (expandedId && sidebarData.length > 0) {
      const index = sidebarData.findIndex((item) => item.id === expandedId);
      if (index !== -1 && containerRef.current) {
        const targetScrollTop = index * 68;
        containerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      }
    }
  }, [expandedId, sidebarData]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setScrollTop(scrollTop);
    if (hasMore && !sidebarLoading && scrollHeight - scrollTop - clientHeight < 200) {
      loadMoreSidebar();
    }
  };

  const ITEM_HEIGHT = 68;
  const totalHeight = sidebarData.length * ITEM_HEIGHT;

  let startNode = Math.floor(scrollTop / ITEM_HEIGHT);
  let visibleNodeCount = Math.ceil(containerHeight / ITEM_HEIGHT);
  startNode = Math.max(0, startNode - 2);
  visibleNodeCount = Math.min(sidebarData.length - startNode, visibleNodeCount + 4);

  const visibleItems = [];
  for (let i = 0; i < visibleNodeCount; i++) {
    const index = startNode + i;
    if (index >= sidebarData.length) break;

    const row = sidebarData[index];
    const isSelected = expandedId === row.id || targetScrolledId === String(row.id);

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
            ${isSelected ? "bg-primary text-white" : "hover:bg-gray-100 text-text-main"}
          `}
        >
          <div className="font-bold truncate font-serif">{row.nome}</div>
          <div className={`text-xs truncate ${isSelected ? "text-white/80" : "text-text-accent"}`}>
            {row.mestiere || "Nessun mestiere"}
          </div>
        </button>
      </div>,
    );
  }

  return (
    <>
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/30 z-30 md:hidden backdrop-blur-[2px]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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
          <h2 className="font-bold text-text-main uppercase text-xs tracking-wider flex items-center gap-2">
            <List className="h-4 w-4" /> Indice
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-text-accent hover:text-primary p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto relative" ref={containerRef} onScroll={onScroll}>
          {sidebarData.length > 0 ? (
            <div style={{ height: totalHeight, position: "relative" }}>
              {visibleItems}
              {sidebarLoading && hasMore && (
                <div className="absolute w-full flex justify-center py-4" style={{ top: totalHeight - ITEM_HEIGHT }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          ) : sidebarLoading ? (
            <div className="p-4 text-center text-sm text-text-accent italic">Caricamento indice...</div>
          ) : (
            <div className="p-4 text-center text-sm text-text-accent">Nessun risultato.</div>
          )}
        </div>
      </aside>
    </>
  );
});
