import type { SupabaseClientType } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";

export type MapTag = Database["public"]["Views"]["map_tags_with_usage"]["Row"];

export const getMapTags = async (
  supabase: SupabaseClientType,
  mapId: string,
  searchQuery?: string
): Promise<MapTag[]> => {
  let query = supabase
    .from("map_tags_with_usage")
    .select("*")
    .eq("map_id", mapId)
    .order("usage_count", { ascending: false })
    .order("name", { ascending: true })
    .limit(50);

  if (searchQuery && searchQuery.trim().length > 0) {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    query = query.ilike("name", `%${normalizedQuery}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as MapTag[];
};

