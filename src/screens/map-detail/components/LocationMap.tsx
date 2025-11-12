import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getLocationMarkerIcon,
  getLocationCategoryLabel,
  getLocationCategoryColor,
  getUserLocationMarkerIcon,
} from "@/lib/mapIcons";

type MapLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  type?: string | null;
};

type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type LocationMapProps = {
  locations: MapLocation[];
  onSelectLocation?: (locationId: string) => void;
  center?: LatLngExpression;
  userLocation?: UserLocation | null;
  onRequestLocation?: () => void;
};

const MapViewUpdater = ({ center }: { center: LatLngExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const UserLocationOverlay = ({ location }: { location: UserLocation }) => {
  const icon = useMemo(() => getUserLocationMarkerIcon(), []);
  const radius = Math.max(location.accuracy ?? 0, 30);
  const position: LatLngExpression = [location.latitude, location.longitude];

  return (
    <>
      <Circle
        center={position}
        radius={radius}
        pathOptions={{
          color: "#2563eb",
          fillColor: "rgba(37, 99, 235, 0.25)",
          weight: 1,
          fillOpacity: 0.4,
        }}
      />
      <Marker position={position} icon={icon} />
    </>
  );
};

const RecenterControl = ({
  userLocation,
  onRequestLocation,
}: {
  userLocation?: UserLocation | null;
  onRequestLocation?: () => void;
}) => {
  const map = useMap();

  const handleClick = () => {
    if (userLocation) {
      map.flyTo([userLocation.latitude, userLocation.longitude], Math.max(map.getZoom(), 14));
    } else {
      onRequestLocation?.();
    }
  };

  return (
    <div className="leaflet-top leaflet-right pointer-events-none">
      <div className="leaflet-control pointer-events-auto">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleClick}
          className="m-2 h-9 w-9 rounded-full shadow-md"
          aria-label={userLocation ? "Center map on my location" : "Locate me"}
          title={userLocation ? "Center map on my location" : "Locate me"}
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const LocationMap = ({ locations, onSelectLocation, center, userLocation, onRequestLocation }: LocationMapProps) => {
  const initialCenter = center ?? [locations[0]?.latitude ?? 0, locations[0]?.longitude ?? 0];

  return (
    <div className="relative h-[540px] overflow-hidden rounded-2xl border border-border/80">
      <MapContainer center={initialCenter} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center ? <MapViewUpdater center={center} /> : null}
        {userLocation ? <UserLocationOverlay location={userLocation} /> : null}
        <RecenterControl userLocation={userLocation} onRequestLocation={onRequestLocation} />
        {locations.map((location) => {
          const categoryLabel = getLocationCategoryLabel(location.type);
          const categoryColor = getLocationCategoryColor(location.type);
          return (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={getLocationMarkerIcon(location.type)}
              eventHandlers={{
                click: () => onSelectLocation?.(location.id),
              }}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{location.name}</h3>
                    <span
                      className="rounded-full px-2 py-[2px] text-[10px] font-medium"
                      style={{ backgroundColor: `${categoryColor}33`, color: "#1f2937" }}
                    >
                      {categoryLabel}
                    </span>
                  </div>
                  {location.description ? (
                    <p className="text-muted-foreground">{location.description}</p>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

