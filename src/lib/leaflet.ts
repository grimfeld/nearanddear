import L from "leaflet";
import type { PointExpression } from "leaflet";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png?url";
import iconUrl from "leaflet/dist/images/marker-icon.png?url";
import shadowUrl from "leaflet/dist/images/marker-shadow.png?url";

const ICON_SIZE: PointExpression = [25, 41];
const ICON_ANCHOR: PointExpression = [12, 41];
const POPUP_ANCHOR: PointExpression = [1, -34];
const TOOLTIP_ANCHOR: PointExpression = [16, -28];
const SHADOW_SIZE: PointExpression = [41, 41];

export const setupLeafletIcons = () => {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  });

  const defaultIcon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: ICON_SIZE,
    iconAnchor: ICON_ANCHOR,
    popupAnchor: POPUP_ANCHOR,
    tooltipAnchor: TOOLTIP_ANCHOR,
    shadowSize: SHADOW_SIZE,
    className: "leaflet-default-icon",
  });

  L.Marker.prototype.options.icon = defaultIcon;
};

