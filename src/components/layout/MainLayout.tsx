import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { DolarDisplay } from "@/components/DolarDisplay";
import { QuickAccess } from "@/components/QuickAccess";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/constants";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          "lg:ml-64" // Desktop sidebar width
        )}
      >
        {/* Top header for desktop */}
        <div className="hidden lg:flex fixed top-0 right-0 left-64 z-30 bg-card border-b border-border p-4 justify-end">
          <DolarDisplay />
        </div>

        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="font-display font-bold text-primary text-lg">
            {APP_CONFIG.BRAND.SHORT_NAME || APP_CONFIG.BRAND.NAME || APP_CONFIG.NAME}
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <div className="p-4 pt-16 lg:p-8 lg:pt-20">{children}</div>
      </main>

      <QuickAccess />
    </div>
  );
}
