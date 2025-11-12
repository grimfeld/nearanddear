import { Outlet } from "react-router-dom";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
      <OnboardingModal />
    </div>
  );
};

