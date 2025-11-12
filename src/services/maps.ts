import type { SupabaseClientType } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import type { MapDetail, MapFavorite, MapMember, MapRecord, Profile } from "@/types/models";

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

  if (sharedResult.error) {
    // eslint-disable-next-line no-console
    console.warn("[getMapsForUser] Failed to load shared maps", sharedResult.error);
  }

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

  if (locationResult.error) {
    // eslint-disable-next-line no-console
    console.warn("[getMapsForUser] Failed to load location counts", locationResult.error);
  }

  if (ratingResult.error) {
    // eslint-disable-next-line no-console
    console.warn("[getMapsForUser] Failed to load ratings", ratingResult.error);
  }

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

type PublicMapRow = Database["public"]["Tables"]["maps"]["Row"] & {
  owner?: Profile | null;
};

export const getPopularPublicMaps = async (
  supabase: SupabaseClientType,
  profileId: string | null,
  limit = 30
): Promise<MapRecord[]> => {
  const { data, error } = await supabase
    .from("maps")
    .select("*, owner:profiles!maps_owner_id_fkey(id, display_name, avatar_url)")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const maps = (data ?? []) as PublicMapRow[];

  if (maps.length === 0) {
    return [];
  }

  const mapIds = maps.map((map) => map.id);

  const [favoritesResult, locationResult, ratingResult] = await Promise.all([
    supabase
      .from("map_favorites")
      .select("map_id, profile_id")
      .in("map_id", mapIds),
    supabase
      .from("locations")
      .select("map_id")
      .in("map_id", mapIds),
    supabase
      .from("reviews")
      .select("location_id, rating, locations(map_id)")
      .in("locations.map_id", mapIds),
  ]);

  if (favoritesResult.error) {
    // eslint-disable-next-line no-console
    console.warn("[getPopularPublicMaps] Failed to load favorites", favoritesResult.error);
  }

  if (locationResult.error) {
    // eslint-disable-next-line no-console
    console.warn("[getPopularPublicMaps] Failed to load location counts", locationResult.error);
  }

  if (ratingResult.error) {
    // eslint-disable-next-line no-console
    console.warn("[getPopularPublicMaps] Failed to load ratings", ratingResult.error);
  }

  const favoriteCountMap = new Map<string, number>();
  const favoriteUserSet = new Set<string>();
  const favoriteRows = (favoritesResult.data ?? []) as Array<
    Pick<MapFavorite, "map_id" | "profile_id">
  >;

  favoriteRows.forEach((row) => {
    favoriteCountMap.set(row.map_id, (favoriteCountMap.get(row.map_id) ?? 0) + 1);
    if (profileId && row.profile_id === profileId) {
      favoriteUserSet.add(row.map_id);
    }
  });

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
    const favoriteCount = favoriteCountMap.get(map.id) ?? 0;
    const locationCount = locationCountMap.get(map.id) ?? 0;
    const rating = ratingAggregate.get(map.id);
    const averageRating = rating ? rating.total / Math.max(rating.count, 1) : null;

    return {
      ...map,
      owner: map.owner ?? null,
      favorite_count: favoriteCount,
      is_favorite: profileId ? favoriteUserSet.has(map.id) : false,
      location_count: locationCount,
      average_rating: averageRating,
    };
  });

  return enriched.sort((a, b) => {
    const favoriteDifference = (b.favorite_count ?? 0) - (a.favorite_count ?? 0);
    if (favoriteDifference !== 0) return favoriteDifference;

    const ratingDifference = (b.average_rating ?? 0) - (a.average_rating ?? 0);
    if (ratingDifference !== 0) return ratingDifference;

    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
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
  if (!data) return null;

  // Fetch tags for all locations in this map
  const locationIds = (data.locations ?? []).map((loc: any) => loc.id);
  const locationTagMap = new Map<string, string[]>();

  if (locationIds.length > 0) {
    // Fetch location_tags and map_tags separately, then join in JavaScript
    const { data: locationTagsData, error: locationTagsError } = await supabase
      .from("location_tags")
      .select("location_id, tag_id")
      .in("location_id", locationIds);

    if (locationTagsError) {
      // eslint-disable-next-line no-console
      console.warn("[getMapDetail] Failed to load location tags", locationTagsError);
    } else if (locationTagsData && locationTagsData.length > 0) {
      // Get unique tag IDs
      const tagIds = Array.from(new Set(locationTagsData.map((item: any) => item.tag_id)));

      // Fetch tag names
      const { data: mapTagsData, error: mapTagsError } = await supabase
        .from("map_tags")
        .select("id, name")
        .in("id", tagIds);

      if (mapTagsError) {
        // eslint-disable-next-line no-console
        console.warn("[getMapDetail] Failed to load map tags", mapTagsError);
      } else if (mapTagsData) {
        // Create a map of tag_id -> tag name
        const tagNameMap = new Map<string, string>();
        mapTagsData.forEach((tag: any) => {
          tagNameMap.set(tag.id, tag.name);
        });

        // Build location_id -> tag names map
        locationTagsData.forEach((item: any) => {
          const locationId = item.location_id;
          const tagName = tagNameMap.get(item.tag_id);
          if (locationId && tagName) {
            const existingTags = locationTagMap.get(locationId) ?? [];
            locationTagMap.set(locationId, [...existingTags, tagName]);
          }
        });
      }
    }
  }

  // Populate tags in locations
  const enrichedData = {
    ...data,
    locations: (data.locations ?? []).map((location: any) => {
      const tags = locationTagMap.get(location.id) ?? [];
      // Merge with existing tags from the old structure (for backward compatibility)
      const existingTags = location.tags ?? [];
      const allTags = Array.from(new Set([...existingTags, ...tags]));
      return {
        ...location,
        tags: allTags.length > 0 ? allTags : null,
      };
    }),
  };

  return enrichedData as MapDetail | null;
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

export const addMapFavorite = async (
  supabase: SupabaseClientType,
  mapId: string,
  profileId: string
) => {
  const insertPayload: Database["public"]["Tables"]["map_favorites"]["Insert"] = {
    map_id: mapId,
    profile_id: profileId,
  };
  const client = supabase as any;
  const { error } = await client
    .from("map_favorites")
    .upsert(insertPayload, { onConflict: "map_id,profile_id" });
  if (error) throw error;
};

export const removeMapFavorite = async (
  supabase: SupabaseClientType,
  mapId: string,
  profileId: string
) => {
  const { error } = await supabase
    .from("map_favorites")
    .delete()
    .match({ map_id: mapId, profile_id: profileId });
  if (error) throw error;
};

