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

// Helper function to create or get tags for a map
const ensureTags = async (
  supabase: SupabaseClientType,
  mapId: string,
  tagNames: string[]
): Promise<string[]> => {
  if (!tagNames || tagNames.length === 0) return [];

  // Normalize tag names (trim, lowercase, remove empty)
  const normalizedTags = tagNames
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  if (normalizedTags.length === 0) return [];

  // Fetch existing tags
  const { data: existingTags, error: fetchError } = await supabase
    .from("map_tags")
    .select("id, name")
    .eq("map_id", mapId)
    .in("name", normalizedTags);

  if (fetchError) throw fetchError;

  const existingTagMap = new Map<string, string>();
  (existingTags ?? []).forEach((tag) => {
    existingTagMap.set(tag.name, tag.id);
  });

  // Create missing tags
  const missingTags = normalizedTags.filter((tag) => !existingTagMap.has(tag));
  if (missingTags.length > 0) {
    const tagsToInsert = missingTags.map((name) => ({
      map_id: mapId,
      name,
    }));

    const { data: newTags, error: insertError } = await supabase
      .from("map_tags")
      .insert(tagsToInsert)
      .select("id, name");

    if (insertError) throw insertError;

    (newTags ?? []).forEach((tag) => {
      existingTagMap.set(tag.name, tag.id);
    });
  }

  // Return all tag IDs
  return normalizedTags.map((tag) => existingTagMap.get(tag)!).filter(Boolean);
};

// Helper function to link location to tags
const linkLocationToTags = async (
  supabase: SupabaseClientType,
  locationId: string,
  tagIds: string[]
) => {
  if (tagIds.length === 0) {
    // Remove all tags if empty
    const { error } = await supabase.from("location_tags").delete().eq("location_id", locationId);
    if (error) throw error;
    return;
  }

  // Delete existing tags
  const { error: deleteError } = await supabase
    .from("location_tags")
    .delete()
    .eq("location_id", locationId);

  if (deleteError) throw deleteError;

  // Insert new tags
  const linksToInsert = tagIds.map((tagId) => ({
    location_id: locationId,
    tag_id: tagId,
  }));

  const { error: insertError } = await supabase.from("location_tags").insert(linksToInsert);

  if (insertError) throw insertError;
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
    tags: null, // We'll use the new tag structure, but keep this for backward compatibility
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

  const location = data as LocationRecord;

  // Handle tags using new structure
  if (payload.tags && payload.tags.length > 0) {
    const tagIds = await ensureTags(supabase, mapId, payload.tags);
    await linkLocationToTags(supabase, location.id, tagIds);
  }

  return location;
};

export const updateLocation = async (
  supabase: SupabaseClientType,
  locationId: string,
  mapId: string,
  payload: Partial<LocationPayload>
) => {
  const updatePayload: Database["public"]["Tables"]["locations"]["Update"] = {
    name: payload.name,
    description: payload.description ?? null,
    address: payload.address ?? null,
    latitude: payload.latitude,
    longitude: payload.longitude,
    type: payload.type ?? null,
    website: payload.website ?? null,
    phone: payload.phone ?? null,
    opening_hours: payload.opening_hours ?? null,
    google_place_id: payload.google_place_id ?? null,
    notes: payload.notes ?? null,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined values
  Object.keys(updatePayload).forEach((key) => {
    if (updatePayload[key as keyof typeof updatePayload] === undefined) {
      delete updatePayload[key as keyof typeof updatePayload];
    }
  });

  const client = supabase as any;
  const { data, error } = await client
    .from("locations")
    .update(updatePayload)
    .eq("id", locationId)
    .select("*")
    .single();

  if (error) throw error;

  const location = data as LocationRecord;

  // Handle tags using new structure if provided
  if (payload.tags !== undefined) {
    const tagIds = await ensureTags(supabase, mapId, payload.tags ?? []);
    await linkLocationToTags(supabase, locationId, tagIds);
  }

  return location;
};

export const deleteLocation = async (supabase: SupabaseClientType, locationId: string) => {
  const { error } = await supabase.from("locations").delete().eq("id", locationId);
  if (error) throw error;
};

