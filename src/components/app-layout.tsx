import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { UserSettingsProvider } from "@/providers/user-settings-provider";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to the top of the document upon router navigation
    window.scrollTo(0, 0);
  }, [location.key]);

  return (
    <UserSettingsProvider>
      <div className="flex min-h-screen flex-col">
        <div className="sticky top-0 z-50 bg-background">
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
          <Toaster />
        </main>
      </div>
    </UserSettingsProvider>
  );
}
