import type { SupabaseClientType } from "@/lib/supabaseClient";
import type { Database } from "@/types/database";
import type { ReviewRecord } from "@/types/models";

export type ReviewPayload = {
  rating: number;
  comment?: string | null;
  visited_at?: string | null;
};

export const createReview = async (
  supabase: SupabaseClientType,
  locationId: string,
  profileId: string,
  payload: ReviewPayload
) => {
  const insertPayload: Database["public"]["Tables"]["reviews"]["Insert"] = {
    location_id: locationId,
    profile_id: profileId,
    rating: payload.rating,
    comment: payload.comment ?? null,
    visited_at: payload.visited_at ?? null,
  };

  const client = supabase as any;
  const { data, error } = await client
    .from("reviews")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return data as ReviewRecord;
};

export const deleteReview = async (supabase: SupabaseClientType, reviewId: string) => {
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) throw error;
};

