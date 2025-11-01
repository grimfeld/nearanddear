import { useCallback, useState } from "react";

type GeolocationState = {
  latitude: number;
  longitude: number;
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setIsLoading(false);
      },
      (geoError) => {
        setError(geoError.message);
        setIsLoading(false);
      }
    );
  }, []);

  return {
    location,
    error,
    isLoading,
    requestLocation,
  };
};

