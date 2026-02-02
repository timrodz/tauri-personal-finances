import { Header } from "@/components/header";
import { UserSettingsProvider } from "@/providers/user-settings-provider";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

export function AppLayout() {
  return (
    <UserSettingsProvider>
      <div className="flex min-h-screen flex-col">
        <div className="sticky top-0 z-10 bg-background">
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
