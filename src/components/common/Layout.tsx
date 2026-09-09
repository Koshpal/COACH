import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

const MobileMenuCtx = createContext<() => void>(() => {});
export const useMobileMenu = () => useContext(MobileMenuCtx);

/**
 * Figma shell — floating white panels on a #f6f6f6 canvas with 24px gutters.
 * Sidebar: fixed, 256px (88px collapsed). Content column is inset to clear it.
 * Pages render their own <Header/> as the first child (kept from the coach app).
 */
export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true",
  );

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((c) => !c)}
      />

      <div
        className={`flex min-h-screen flex-col gap-6 p-4 transition-[padding] duration-300 ease-in-out lg:py-6 lg:pr-6 ${
          isCollapsed ? "lg:pl-[136px]" : "lg:pl-[304px]"
        }`}
      >
        <MobileMenuCtx.Provider value={() => setIsSidebarOpen(true)}>
          <main className="flex flex-1 flex-col gap-6 animate-fade-in">
            <Outlet />
          </main>
        </MobileMenuCtx.Provider>
      </div>
    </div>
  );
};
