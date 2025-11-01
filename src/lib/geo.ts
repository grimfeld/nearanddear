import type { LocationRecord } from "@/types/models";

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const isLocationOpenNow = (location: LocationRecord) => {
  if (!location.opening_hours) return false;
  const now = new Date();
  const day = now.toLocaleDateString(undefined, { weekday: "long" }).toLowerCase();
  const hours = (location.opening_hours as Record<string, { open: string; close: string } | null>)[day];
  if (!hours) return false;

  const [openHour, openMinute] = hours.open.split(":").map(Number);
  const [closeHour, closeMinute] = hours.close.split(":").map(Number);

  const openTime = new Date(now);
  openTime.setHours(openHour, openMinute, 0, 0);
  const closeTime = new Date(now);
  closeTime.setHours(closeHour, closeMinute, 0, 0);

  if (closeTime <= openTime) {
    closeTime.setDate(closeTime.getDate() + 1);
  }

  return now >= openTime && now <= closeTime;
};

