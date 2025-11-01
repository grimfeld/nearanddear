import type { SupabaseClientType } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import type { LocationRecord } from "@/types/models";

export type LocationPayload = {
  name: string;
  description?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  type?: string | null;
  tags?: string[] | null;
  website?: string | null;
  phone?: string | null;
  opening_hours?: Record<string, { open: string; close: string } | null> | null;
  google_place_id?: string | null;
  notes?: string | null;
};

export const createLocation = async (
  supabase: SupabaseClientType,
  mapId: string,
  profileId: string,
  payload: LocationPayload
) => {
  const insertPayload: Database["public"]["Tables"]["locations"]["Insert"] = {
    map_id: mapId,
    created_by: profileId,
    name: payload.name,
    description: payload.description ?? null,
    address: payload.address ?? null,
    latitude: payload.latitude,
    longitude: payload.longitude,
    type: payload.type ?? null,
    tags: payload.tags ?? null,
    website: payload.website ?? null,
    phone: payload.phone ?? null,
    opening_hours: payload.opening_hours ?? null,
    google_place_id: payload.google_place_id ?? null,
    notes: payload.notes ?? null,
  };

  const client = supabase as any;
  const { data, error } = await client
    .from("locations")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return data as LocationRecord;
};

export const updateLocation = async (
  supabase: SupabaseClientType,
  locationId: string,
  payload: Partial<LocationPayload>
) => {
  const updatePayload: Database["public"]["Tables"]["locations"]["Update"] = {
    ...payload,
    tags: payload.tags ?? null,
    updated_at: new Date().toISOString(),
  };

  const client = supabase as any;
  const { data, error } = await client
    .from("locations")
    .update(updatePayload)
    .eq("id", locationId)
    .select("*")
    .single();

  if (error) throw error;
  return data as LocationRecord;
};

export const deleteLocation = async (supabase: SupabaseClientType, locationId: string) => {
  const { error } = await supabase.from("locations").delete().eq("id", locationId);
  if (error) throw error;
};

