import L from "leaflet";
import { Beer, Coffee, Landmark, MapPin, Trees, Utensils, type LucideIcon } from "lucide-react";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { getCategoryLabel } from "./locationCategories";

export type MarkerCategory = "restaurant" | "bar" | "cafe" | "park" | "attraction" | "other";

const markerStyles = `
.custom-div-icon {
  background: none;
  border: none;
}
.marker-pin {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  left: 50%;
  top: 50%;
  margin: -15px 0 0 -15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}
.marker-pin::after {
  content: "";
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}
.marker-pin svg {
  position: absolute;
  width: 16px;
  height: 16px;
  margin: 3px;
  transform: rotate(45deg);
  z-index: 1;
}
.user-location-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #2563eb;
  border: 3px solid white;
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
}
.user-location-accuracy {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: rgba(37, 99, 235, 0.2);
  border: 1px solid rgba(37, 99, 235, 0.3);
}
`;

let stylesInjected = false;

const injectMarkerStyles = () => {
  if (stylesInjected) return;
  if (typeof document === "undefined") return;
  const styleElement = document.createElement("style");
  styleElement.textContent = markerStyles;
  document.head.appendChild(styleElement);
  stylesInjected = true;
};

const categoryConfig: Record<MarkerCategory, { color: string; Icon: LucideIcon }> = {
  restaurant: { color: "#e25141", Icon: Utensils },
  bar: { color: "#9c59d1", Icon: Beer },
  cafe: { color: "#ff9933", Icon: Coffee },
  park: { color: "#45ad45", Icon: Trees },
  attraction: { color: "#ffcb29", Icon: Landmark },
  other: { color: "#3388ff", Icon: MapPin },
};

const createCategoryIcon = (color: string, Icon: LucideIcon) =>
  new L.DivIcon({
    className: "custom-div-icon",
    html: `
      <div class="marker-pin" style="background-color: ${color};">
        ${ReactDOMServer.renderToString(<Icon size={16} color={color} />)}
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -35],
  });

const placeIcons: Record<MarkerCategory, L.DivIcon> = Object.entries(categoryConfig).reduce(
  (icons, [key, { color, Icon }]) => {
    icons[key as MarkerCategory] = createCategoryIcon(color, Icon);
    return icons;
  },
  {} as Record<MarkerCategory, L.DivIcon>
);

export const normalizeCategory = (type?: string | null): MarkerCategory => {
  if (!type) return "other";
  const normalised = type.toLowerCase().trim();
  if (!normalised) return "other";
  if (/(restaurant|resto|bistro|diner|eat|food|brasserie)/.test(normalised)) return "restaurant";
  if (/(bar|pub|brew|cocktail|wine|speakeasy)/.test(normalised)) return "bar";
  if (/(café|cafe|coffee|espresso|tea|bakery)/.test(normalised)) return "cafe";
  if (/(park|garden|green|nature|outdoor|forest)/.test(normalised)) return "park";
  if (/(attraction|museum|gallery|monument|landmark|theatre|theater|sightseeing)/.test(normalised))
    return "attraction";
  return "other";
};

export const getLocationMarkerIcon = (type?: string | null) => {
  injectMarkerStyles();
  const category = normalizeCategory(type);
  return placeIcons[category];
};

export const getLocationCategoryColor = (type?: string | null) =>
  categoryConfig[normalizeCategory(type)].color;

export const getLocationCategoryLabel = (type?: string | null) => {
  // Use the new category system which handles all categories
  // It will format unknown values and return "Other" for null/undefined
  return getCategoryLabel(type);
};

export const getUserLocationMarkerIcon = () => {
  injectMarkerStyles();
  return new L.DivIcon({
    className: "custom-div-icon",
    html: '<div class="user-location-marker"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};


