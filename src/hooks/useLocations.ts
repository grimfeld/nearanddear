import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createLocation, deleteLocation, updateLocation } from "@/services/locations";
import type { LocationPayload } from "@/services/locations";
import { createReview, deleteReview } from "@/services/reviews";
import type { ReviewPayload } from "@/services/reviews";
import { useAuth } from "@/providers/AuthProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import { useMemo } from "react";
import { mapKeys } from "@/hooks/useMaps";


export const useLocationMutations = (mapId: string) => {
  const { profile, user } = useAuth();
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  const invalidate = useMemo(
    () => () =>
      queryClient.invalidateQueries({
        queryKey: mapKeys.detail(mapId),
      }),
    [mapId, queryClient]
  );

  const create = useMutation({
    mutationFn: async (payload: LocationPayload) => {
      const actorId = profile?.id ?? user?.id;
      if (!actorId) throw new Error("Sign in required");
      return createLocation(supabase, mapId, actorId, payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Location added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: ({ locationId, payload }: { locationId: string; payload: Partial<LocationPayload> }) =>
      updateLocation(supabase, locationId, mapId, payload),
    onSuccess: async () => {
      await invalidate();
      toast.success("Location updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (locationId: string) => deleteLocation(supabase, locationId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Location removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviewCreate = useMutation({
    mutationFn: ({ locationId, payload }: { locationId: string; payload: ReviewPayload }) => {
      if (!profile) throw new Error("Sign in required");
      return createReview(supabase, locationId, profile.id, payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Review submitted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviewDelete = useMutation({
    mutationFn: (reviewId: string) => deleteReview(supabase, reviewId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Review removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    createLocation: create.mutateAsync,
    updateLocation: update.mutateAsync,
    deleteLocation: remove.mutateAsync,
    createReview: reviewCreate.mutateAsync,
    deleteReview: reviewDelete.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  };
};

