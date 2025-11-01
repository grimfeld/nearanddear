import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

type MapLocation = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string | null;
};

type LocationMapProps = {
  locations: MapLocation[];
  onSelectLocation?: (locationId: string) => void;
  center?: LatLngExpression;
  selectedLocationId?: string | null;
};

const MapViewUpdater = ({ center }: { center: LatLngExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const LocationMap = ({ locations, onSelectLocation, center }: LocationMapProps) => {
  const initialCenter = center ?? [locations[0]?.latitude ?? 0, locations[0]?.longitude ?? 0];

  return (
    <div className="h-[540px] overflow-hidden rounded-2xl border border-border/80">
      <MapContainer center={initialCenter} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {center ? <MapViewUpdater center={center} /> : null}
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            eventHandlers={{
              click: () => onSelectLocation?.(location.id),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{location.name}</h3>
                {location.description ? (
                  <p className="text-xs text-muted-foreground">{location.description}</p>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

