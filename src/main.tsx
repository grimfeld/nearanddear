import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { setupLeafletIcons } from "@/lib/leaflet";

setupLeafletIcons();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
