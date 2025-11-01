import type { SupabaseClientType } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import type { MapDetail, MapMember, MapRecord } from "@/types/models";

export type MapPayload = {
  title: string;
  description?: string | null;
  is_public?: boolean;
  cover_url?: string | null;
};

export const getMapsForUser = async (
  supabase: SupabaseClientType,
  profileId: string
): Promise<MapRecord[]> => {
  const [ownedResult, sharedResult] = await Promise.all([
    supabase
      .from("maps")
      .select("*")
      .eq("owner_id", profileId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("map_members")
      .select("role, maps(*)")
      .eq("profile_id", profileId),
  ]);

  if (ownedResult.error) throw ownedResult.error;
  if (sharedResult.error) throw sharedResult.error;

  const ownedData = (ownedResult.data ?? []) as MapRecord[];
  const ownedMaps = ownedData.map<MapRecord>((map) => ({
    ...map,
    member_role: "owner",
  }));

  const sharedData = (sharedResult.data ?? []) as Array<{
    role: MapRecord["member_role"];
    maps: MapRecord | null;
  }>;

  const memberMaps = sharedData
    .map((item) => {
      if (!item.maps) return null;
      return {
        ...item.maps,
        member_role: item.role,
      };
    })
    .filter(Boolean) as MapRecord[];

  const deduped = new Map<string, MapRecord>();
  [...ownedMaps, ...memberMaps].forEach((map) => {
    deduped.set(map.id, map);
  });

  const maps = Array.from(deduped.values());

  if (maps.length === 0) return maps;

  const mapIds = maps.map((map) => map.id);

  const [locationResult, ratingResult] = await Promise.all([
    supabase
      .from("locations")
      .select("map_id")
      .in("map_id", mapIds),
    supabase
      .from("reviews")
      .select("location_id, rating, locations(map_id)")
      .in("locations.map_id", mapIds),
  ]);

  if (locationResult.error) throw locationResult.error;
  if (ratingResult.error) throw ratingResult.error;

  const locationCountMap = new Map<string, number>();
  const locationRows = (locationResult.data ?? []) as Array<{ map_id: string }>;
  locationRows.forEach((row) => {
    locationCountMap.set(row.map_id, (locationCountMap.get(row.map_id) ?? 0) + 1);
  });

  const ratingAggregate = new Map<string, { total: number; count: number }>();
  const ratingRows = (ratingResult.data ?? []) as Array<{
    rating: number;
    locations: { map_id: string } | null;
  }>;
  ratingRows.forEach((row) => {
    const mapId = row.locations?.map_id;
    if (!mapId) return;
    const entry = ratingAggregate.get(mapId) ?? { total: 0, count: 0 };
    entry.total += row.rating ?? 0;
    entry.count += 1;
    ratingAggregate.set(mapId, entry);
  });

  const enriched = maps.map<MapRecord>((map) => {
    const locationCount = locationCountMap.get(map.id) ?? 0;
    const rating = ratingAggregate.get(map.id);
    return {
      ...map,
      location_count: locationCount,
      average_rating: rating ? rating.total / Math.max(rating.count, 1) : null,
    };
  });

  return enriched.sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
};

export const getMapDetail = async (
  supabase: SupabaseClientType,
  mapId: string
) => {
  const { data, error } = await supabase
    .from("maps")
    .select(
      `*,
      owner:profiles!maps_owner_id_fkey(*),
      map_members(role, profile_id, profile:profiles(*)),
      locations(*, reviews(*, profile:profiles(*)))`
    )
    .eq("id", mapId)
    .maybeSingle();

  if (error) throw error;
  return data as MapDetail | null;
};

export const createMap = async (
  supabase: SupabaseClientType,
  ownerId: string,
  payload: MapPayload
) => {
  const insertPayload: Database["public"]["Tables"]["maps"]["Insert"] = {
    owner_id: ownerId,
    title: payload.title,
    description: payload.description ?? null,
    is_public: payload.is_public ?? false,
    cover_url: payload.cover_url ?? null,
  };

  const client = supabase as any;
  const { data, error } = await client
    .from("maps")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;

  return data as MapRecord;
};

export const updateMap = async (
  supabase: SupabaseClientType,
  mapId: string,
  payload: MapPayload
) => {
  const updatePayload: Database["public"]["Tables"]["maps"]["Update"] = {
    title: payload.title,
    description: payload.description ?? null,
    is_public: payload.is_public ?? false,
    cover_url: payload.cover_url ?? null,
    updated_at: new Date().toISOString(),
  };

  const client = supabase as any;
  const { data, error } = await client
    .from("maps")
    .update(updatePayload)
    .eq("id", mapId)
    .select("*")
    .single();

  if (error) throw error;
  return data as MapRecord;
};

export const deleteMap = async (supabase: SupabaseClientType, mapId: string) => {
  const { error } = await supabase.from("maps").delete().eq("id", mapId);
  if (error) throw error;
};

export const addMapMember = async (
  supabase: SupabaseClientType,
  mapId: string,
  profileId: string,
  role: MapMember["role"]
) => {
  const upsertPayload: Database["public"]["Tables"]["map_members"]["Insert"] = {
    map_id: mapId,
    profile_id: profileId,
    role,
  };
  const client = supabase as any;
  const { error } = await client
    .from("map_members")
    .upsert(upsertPayload);
  if (error) throw error;
};

export const removeMapMember = async (
  supabase: SupabaseClientType,
  mapId: string,
  profileId: string
) => {
  const { error } = await supabase
    .from("map_members")
    .delete()
    .match({ map_id: mapId, profile_id: profileId });
  if (error) throw error;
};

