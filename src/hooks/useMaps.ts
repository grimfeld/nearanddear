import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  addMapMember,
  createMap,
  deleteMap,
  getMapDetail,
  getMapsForUser,
  removeMapMember,
  updateMap,
  type MapPayload,
} from "@/services/maps";
import type { MapRecord } from "@/types/models";
import { useAuth } from "@/providers/AuthProvider";
import { useSupabase } from "@/providers/SupabaseProvider";

export const mapKeys = {
  all: ["maps"] as const,
  lists: (profileId: string) => [...mapKeys.all, profileId, "list"] as const,
  detail: (mapId: string) => [...mapKeys.all, mapId, "detail"] as const,
};

export const useMaps = () => {
  const { user } = useAuth();
  const supabase = useSupabase();

  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: mapKeys.lists(user?.id ?? "guest"),
    queryFn: async () => {
      if (!user) return [] as MapRecord[];
      return getMapsForUser(supabase, user.id);
    },
    enabled: !!user,
  });

  const mutateCreate = useMutation({
    mutationFn: async (payload: MapPayload) => {
      if (!user) throw new Error("You must be signed in");
      return createMap(supabase, user.id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: mapKeys.lists(user?.id ?? "guest"),
      });
      toast.success("Map created");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mutateUpdate = useMutation({
    mutationFn: ({ mapId, payload }: { mapId: string; payload: MapPayload }) =>
      updateMap(supabase, mapId, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: mapKeys.lists(user?.id ?? "guest") }),
        queryClient.invalidateQueries({ queryKey: mapKeys.detail(variables.mapId) }),
      ]);
      toast.success("Map updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mutateDelete = useMutation({
    mutationFn: (mapId: string) => deleteMap(supabase, mapId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: mapKeys.lists(user?.id ?? "guest"),
      });
      toast.success("Map removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mutateMemberAdd = useMutation({
    mutationFn: ({ mapId, profileId, role }: { mapId: string; profileId: string; role: MapRecord["member_role"] }) =>
      addMapMember(supabase, mapId, profileId!, role ?? "viewer"),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: mapKeys.detail(variables.mapId) });
      toast.success("Member added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mutateMemberRemove = useMutation({
    mutationFn: ({ mapId, profileId }: { mapId: string; profileId: string }) =>
      removeMapMember(supabase, mapId, profileId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: mapKeys.detail(variables.mapId) });
      toast.success("Member removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    ...listQuery,
    createMap: mutateCreate.mutateAsync,
    updateMap: mutateUpdate.mutateAsync,
    deleteMap: mutateDelete.mutateAsync,
    addMember: mutateMemberAdd.mutateAsync,
    removeMember: mutateMemberRemove.mutateAsync,
  };
};

export const useMapDetail = (mapId?: string) => {
  const supabase = useSupabase();

  return useQuery({
    queryKey: mapKeys.detail(mapId ?? "unknown"),
    queryFn: async () => {
      if (!mapId) return null;
      return getMapDetail(supabase, mapId);
    },
    enabled: !!mapId,
  });
};

