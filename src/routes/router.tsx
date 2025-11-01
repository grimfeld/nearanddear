import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardPage } from "@/screens/dashboard/DashboardPage";
import { LandingPage } from "@/screens/landing/LandingPage";
import { MapDetailPage } from "@/screens/map-detail/MapDetailPage";
import { ProfilePage } from "@/screens/profile/ProfilePage";
import { SignInPage } from "@/screens/auth/SignInPage";
import { SignUpPage } from "@/screens/auth/SignUpPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth/sign-in",
    element: <SignInPage />,
  },
  {
    path: "/auth/sign-up",
    element: <SignUpPage />,
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

