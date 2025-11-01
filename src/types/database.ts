export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          favorite_tags: string[] | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          favorite_tags?: string[] | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          favorite_tags?: string[] | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      maps: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          is_public: boolean;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          is_public?: boolean;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          is_public?: boolean;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      map_members: {
        Row: {
          id: string;
          map_id: string;
          profile_id: string;
          role: "owner" | "editor" | "viewer";
          invited_at: string;
        };
        Insert: {
          id?: string;
          map_id: string;
          profile_id: string;
          role?: "owner" | "editor" | "viewer";
          invited_at?: string;
        };
        Update: {
          id?: string;
          map_id?: string;
          profile_id?: string;
          role?: "owner" | "editor" | "viewer";
          invited_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          map_id: string;
          created_by: string;
          name: string;
          description: string | null;
          address: string | null;
          latitude: number;
          longitude: number;
          type: string | null;
          tags: string[] | null;
          website: string | null;
          phone: string | null;
          opening_hours: Json | null;
          google_place_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          map_id: string;
          created_by: string;
          name: string;
          description?: string | null;
          address?: string | null;
          latitude: number;
          longitude: number;
          type?: string | null;
          tags?: string[] | null;
          website?: string | null;
          phone?: string | null;
          opening_hours?: Json | null;
          google_place_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          map_id?: string;
          created_by?: string;
          name?: string;
          description?: string | null;
          address?: string | null;
          latitude?: number;
          longitude?: number;
          type?: string | null;
          tags?: string[] | null;
          website?: string | null;
          phone?: string | null;
          opening_hours?: Json | null;
          google_place_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          location_id: string;
          profile_id: string;
          rating: number;
          comment: string | null;
          visited_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          profile_id: string;
          rating: number;
          comment?: string | null;
          visited_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          profile_id?: string;
          rating?: number;
          comment?: string | null;
          visited_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      location_rating_summary: {
        Row: {
          location_id: string;
          average_rating: number | null;
          review_count: number;
        };
      };
    };
    Functions: {
      get_locations_within_radius: {
        Args: {
          map_id: string;
          latitude: number;
          longitude: number;
          radius_km: number;
        };
        Returns: {
          id: string;
          name: string;
          distance_km: number;
        }[];
      };
    };
  };
};

