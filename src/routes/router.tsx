import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardPage } from "@/screens/dashboard/DashboardPage";
import { DiscoverPage } from "@/screens/discover/DiscoverPage";
import { LandingPage } from "@/screens/landing/LandingPage";
import { MapDetailPage } from "@/screens/map-detail/MapDetailPage";
import { ProfilePage } from "@/screens/profile/ProfilePage";
import { AuthPage } from "@/screens/auth/AuthPage";
import { InvitePage } from "@/screens/invite/InvitePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/invite/:token",
    element: <InvitePage />,
  },
  {
    path: "/auth/sign-in",
    element: <AuthPage />,
  },
  {
    path: "/auth/sign-up",
    element: <AuthPage />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "discover",
        element: <DiscoverPage />,
      },
      {
        path: "maps/:mapId",
        element: <MapDetailPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
