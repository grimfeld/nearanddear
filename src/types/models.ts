import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MapRecord = Database["public"]["Tables"]["maps"]["Row"] & {
  member_role?: "owner" | "editor" | "viewer";
  member_count?: number;
  location_count?: number;
  average_rating?: number | null;
  favorite_count?: number;
  is_favorite?: boolean;
  owner?: Profile | null;
};
export type MapMember = Database["public"]["Tables"]["map_members"]["Row"] & {
  profile?: Profile;
};
export type MapFavorite = Database["public"]["Tables"]["map_favorites"]["Row"];
export type LocationRecord = Database["public"]["Tables"]["locations"]["Row"] & {
  average_rating?: number | null;
  review_count?: number;
};
export type ReviewRecord = Database["public"]["Tables"]["reviews"]["Row"] & {
  author?: Profile | null;
};

export type MapDetail = MapRecord & {
  owner?: Profile | null;
  map_members: MapMember[];
  locations: Array<
    LocationRecord & {
      reviews: Array<ReviewRecord & { profile?: Profile | null }>;
    }
  >;
};

export type OpeningHours = {
  day: string;
  open: string;
  close: string;
}[];

export type LocationFilters = {
  search: string;
  types: string[];
  openNow: boolean;
  radiusKm: number | null;
  sort: "distance" | "rating" | "recent";
};

