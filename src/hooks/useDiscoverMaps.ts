import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addMapFavorite,
  getPopularPublicMaps,
  removeMapFavorite,
} from "@/services/maps";
import { useAuth } from "@/providers/AuthProvider";
import { useSupabase } from "@/providers/SupabaseProvider";

export const discoverKeys = {
  all: ["discover"] as const,
  lists: (profileId: string) => [...discoverKeys.all, profileId, "list"] as const,
};

export const useDiscoverMaps = () => {
  const { user } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: discoverKeys.lists(user?.id ?? "guest"),
    queryFn: async () => getPopularPublicMaps(supabase, user?.id ?? null),
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to load popular maps";
      toast.error(message);
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async ({ mapId, isFavorite }: { mapId: string; isFavorite: boolean }) => {
      if (!user) throw new Error("You must be signed in to manage favorites");

      if (isFavorite) {
        await removeMapFavorite(supabase, mapId, user.id);
        return { mapId, isFavorite: false as const };
      }

      await addMapFavorite(supabase, mapId, user.id);
      return { mapId, isFavorite: true as const };
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: discoverKeys.lists(user?.id ?? "guest"),
      });
      toast.success(
        variables.isFavorite ? "Removed from favorites" : "Saved to favorites"
      );
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to update favorites";
      toast.error(message);
    },
  });

  return {
    ...listQuery,
    toggleFavorite: favoriteMutation.mutateAsync,
    isTogglingFavorite: favoriteMutation.isPending,
  } as const;
};

