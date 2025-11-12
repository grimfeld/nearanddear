import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { CalendarDays, MapPinPlus, Users } from "lucide-react";
import type { ChangeEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationFilters } from "@/screens/map-detail/components/LocationFilters";
import { LocationFormDialog } from "@/screens/map-detail/components/LocationFormDialog";
import { LocationList } from "@/screens/map-detail/components/LocationList";
import { LocationMap } from "@/screens/map-detail/components/LocationMap";
import { ReviewDialog } from "@/screens/map-detail/components/ReviewDialog";
import { useLocationMutations } from "@/hooks/useLocations";
import { useMapDetail } from "@/hooks/useMaps";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/providers/AuthProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import { removeMapMember } from "@/services/maps";
import type { LocationPayload } from "@/services/locations";
import { calculateDistanceKm, isLocationOpenNow } from "@/lib/geo";
import { Input } from "@/components/ui/input";
import type { LocationFilters as FiltersState, MapDetail, MapRecord } from "@/types/models";
import { toast } from "sonner";

type ReviewSummary = {
  id: string;
  rating: number;
  comment: string | null;
  author: string;
  createdAt: string;
};

type DerivedLocation = MapDetail["locations"][number] & {
  averageRating: number | null;
  reviewCount: number;
  distanceKm: number | null;
  isOpenNow: boolean;
  reviewSummaries: ReviewSummary[];
};

const initialFilters: FiltersState = {
  search: "",
  types: [],
  openNow: false,
  radiusKm: null,
  sort: "recent",
};

export const MapDetailPage = () => {
  const { mapId } = useParams();
  const { profile } = useAuth();
  const { data: mapData, isLoading, error, refetch } = useMapDetail(mapId);
  const { location: userLocation, requestLocation, isLoading: geoLoading, error: geoError } =
    useGeolocation();
  const supabase = useSupabase();

  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DerivedLocation | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewLocation, setReviewLocation] = useState<DerivedLocation | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<MapRecord["member_role"]>("viewer");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const effectiveMapId = mapId ?? "";
  const mapMutations = useLocationMutations(effectiveMapId);

  if (!mapId) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const membership = useMemo(() => {
    if (!mapData || !profile) return null;
    if (mapData.owner_id === profile.id) {
      return { role: "owner" as MapRecord["member_role"], profile };
    }
    return mapData.map_members.find((member) => member.profile_id === profile.id) ?? null;
  }, [mapData, profile]);

  const canEdit = membership?.role === "owner" || membership?.role === "editor";

  const enrichedLocations: DerivedLocation[] = useMemo(() => {
    if (!mapData) return [];
    return (mapData.locations ?? []).map((location) => {
      const reviewSummaries: ReviewSummary[] = (location.reviews ?? []).map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        author: review.profile?.display_name ?? review.profile?.email ?? "Member",
        createdAt: review.created_at,
      }));
      const reviewCount = reviewSummaries.length;
      const averageRating =
        reviewCount > 0
          ? reviewSummaries.reduce((total, review) => total + review.rating, 0) / reviewCount
          : null;

      const distanceKm = userLocation
        ? calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            location.latitude,
            location.longitude
          )
        : null;

      return {
        ...location,
        averageRating,
        reviewCount,
        distanceKm,
        isOpenNow: isLocationOpenNow(location),
        reviewSummaries,
      };
    });
  }, [mapData, userLocation]);


  const filteredLocations = useMemo(() => {
    return enrichedLocations
      .filter((location) => {
        if (filters.search) {
          const needle = filters.search.toLowerCase();
          const haystack = [location.name, location.description ?? "", location.address ?? ""].join(" ")
            .toLowerCase();
          if (!haystack.includes(needle)) return false;
        }

        if (filters.types.length && (!location.type || !filters.types.includes(location.type))) {
          return false;
        }

        if (filters.openNow && !location.isOpenNow) {
          return false;
        }

        if (filters.radiusKm && userLocation) {
          if (location.distanceKm == null || location.distanceKm > filters.radiusKm) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sort) {
          case "rating":
            return (b.averageRating ?? 0) - (a.averageRating ?? 0);
          case "distance":
            if (a.distanceKm == null) return 1;
            if (b.distanceKm == null) return -1;
            return a.distanceKm - b.distanceKm;
          case "recent":
          default:
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });
  }, [enrichedLocations, filters, userLocation]);

  const selectedLocation = enrichedLocations.find((location) => location.id === selectedLocationId);

  const toLocationPayload = (location: DerivedLocation): LocationPayload & { id: string } => {
    const openingHoursValue =
      location.opening_hours &&
      typeof location.opening_hours === "object" &&
      !Array.isArray(location.opening_hours)
        ? (location.opening_hours as Record<string, { open: string; close: string } | null>)
        : null;

    return {
      id: location.id,
      name: location.name,
      description: location.description,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      type: location.type,
      tags: location.tags ?? null,
      website: location.website,
      phone: location.phone,
      google_place_id: location.google_place_id,
      notes: location.notes,
      opening_hours: openingHoursValue,
    };
  };

  const mapCenter = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : filteredLocations.length > 0
    ? [filteredLocations[0].latitude, filteredLocations[0].longitude]
    : [51.505, -0.09];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Skeleton className="h-[520px] rounded-2xl" />
          <Skeleton className="h-[520px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-8 text-destructive">
        Failed to load map: {error.message}
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="rounded-2xl border border-border/70 bg-background/80 p-10 text-center">
        <p className="text-sm text-muted-foreground">Map not found or you no longer have access.</p>
        <Button className="mt-4" variant="ghost" asChild>
          <a href="/app/dashboard">Return to dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-background/80 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{membership?.role ?? "viewer"}</Badge>
            <Badge variant="outline">{mapData.is_public ? "Public" : "Private"}</Badge>
            <Badge variant="outline">{mapData.location_count ?? mapData.locations?.length ?? 0} locations</Badge>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{mapData.title}</h1>
          {mapData.description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">{mapData.description}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" /> {mapData.map_members.length + 1} collaborators
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Updated {new Date(mapData.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        {canEdit ? (
          <Button className="inline-flex items-center gap-2" onClick={() => setLocationDialogOpen(true)}>
            <MapPinPlus className="h-4 w-4" /> Add location
          </Button>
        ) : null}
      </header>

      <LocationFilters
        filters={filters}
        onChange={setFilters}
        onRequestLocation={requestLocation}
        geoStatus={{ hasLocation: !!userLocation, isLoading: geoLoading, error: geoError }}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <LocationList
          locations={filteredLocations.map((location) => ({
            id: location.id,
            name: location.name,
            description: location.description,
            address: location.address,
            type: location.type,
            tags: location.tags,
            averageRating: location.averageRating,
            reviewCount: location.reviewCount,
            latitude: location.latitude,
            longitude: location.longitude,
            distanceKm: location.distanceKm,
            isOpenNow: location.isOpenNow,
            googlePlaceId: location.google_place_id,
            website: location.website,
            phone: location.phone,
            openingHours: location.opening_hours,
            notes: location.notes,
          }))}
          canEdit={canEdit}
          onEdit={(locationId) => {
            const location = enrichedLocations.find((item) => item.id === locationId);
            if (location) {
              setEditingLocation(location);
              setLocationDialogOpen(true);
            }
          }}
          onDelete={async (locationId) => {
            const location = enrichedLocations.find((item) => item.id === locationId);
            if (!location) return;
            const confirmed = window.confirm(`Remove ${location.name}?`);
            if (!confirmed) return;
            await mapMutations.deleteLocation(locationId);
          }}
          onReview={(locationId) => {
            const location = enrichedLocations.find((item) => item.id === locationId);
            if (!location) return;
            setReviewLocation(location);
            setReviewDialogOpen(true);
          }}
        />

        <div className="space-y-4">
          <LocationMap
            locations={filteredLocations.map((location) => ({
              id: location.id,
              name: location.name,
              latitude: location.latitude,
              longitude: location.longitude,
              description: location.description,
              type: location.type,
            }))}
            onSelectLocation={(locationId) => setSelectedLocationId(locationId)}
            center={mapCenter as [number, number]}
            userLocation={
              userLocation
                ? {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    accuracy: userLocation.accuracy ?? null,
                  }
                : null
            }
            onRequestLocation={requestLocation}
          />
          <Card className="border-border/80 bg-background/80">
            <CardHeader>
              <CardTitle className="text-base">Collaborators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Owners can manage collaborators from Supabase dashboard. Editors can update locations and add reviews. Viewers can explore the map and leave feedback.
              </p>
              <div className="space-y-2">
                {mapData.map_members.map((member) => (
                  <div key={member.profile_id} className="flex items-center justify-between rounded-lg border border-border/80 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.profile?.display_name ?? member.profile?.email ?? "Collaborator"}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.profile?.email ?? "Invited user"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{member.role}</Badge>
                      {membership?.role === "owner" && member.profile_id !== profile?.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive"
                          onClick={async () => {
                            try {
                              await removeMapMember(supabase, mapData.id, member.profile_id);
                              await refetch();
                              toast.success("Collaborator removed");
                            } catch (removeError) {
                              const message =
                                removeError instanceof Error
                                  ? removeError.message
                                  : "Unable to remove collaborator";
                              toast.error(message);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
                {membership?.role === "owner" ? (
                  <div className="rounded-lg border border-dashed border-border/80 p-3">
                    <p className="mb-2 text-xs font-medium text-foreground">Invite collaborators</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <label className="text-muted-foreground">Role</label>
                        <select
                          value={inviteRole}
                          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                            setInviteRole(event.target.value as MapRecord["member_role"]);
                            setInviteLink(null);
                          }}
                          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          readOnly
                          value={
                            inviteLink ?? "Generate a link to share with your collaborators"
                          }
                          className="sm:flex-1"
                          onFocus={(event) => event.currentTarget.select()}
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!mapData) return;
                            try {
                              setIsGeneratingInvite(true);
                              if (!inviteLink) {
                                const { data, error } = await supabase.rpc("create_map_invite_link", {
                                  target_map_id: mapData.id,
                                  invite_role: inviteRole ?? "viewer",
                                });

                                if (error) {
                                  throw error;
                                }

                                const token =
                                  typeof data === "object" && data !== null && "token" in data
                                    ? (data as { token?: string }).token
                                    : undefined;

                                if (!token) {
                                  throw new Error("Failed to generate invite link");
                                }

                                const generatedLink = `${window.location.origin}/invite/${token}`;
                                setInviteLink(generatedLink);
                                await navigator.clipboard.writeText(generatedLink);
                                toast.success("Invite link copied to your clipboard");
                              } else {
                                await navigator.clipboard.writeText(inviteLink);
                                toast.success("Invite link copied to your clipboard");
                              }
                            } catch (inviteError) {
                              const message =
                                inviteError instanceof Error
                                  ? inviteError.message
                                  : "Unable to generate invite link";
                              toast.error(message);
                            } finally {
                              setIsGeneratingInvite(false);
                            }
                          }}
                          disabled={isGeneratingInvite}
                          className="sm:w-36"
                        >
                          {isGeneratingInvite
                            ? "Generating..."
                            : inviteLink
                              ? "Copy link"
                              : "Generate link"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Anyone with this link can join as a {inviteRole}. Generate a new link to rotate access at any
                        time.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LocationFormDialog
        open={locationDialogOpen}
        onOpenChange={(open) => {
          setLocationDialogOpen(open);
          if (!open) setEditingLocation(null);
        }}
        initialValues={editingLocation ? toLocationPayload(editingLocation) : undefined}
        onSubmit={async (payload) => {
          if (editingLocation) {
            await mapMutations.updateLocation({ locationId: editingLocation.id, payload });
          } else {
            await mapMutations.createLocation(payload);
          }
        }}
        mapId={effectiveMapId}
      />

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={(open) => {
          setReviewDialogOpen(open);
          if (!open) setReviewLocation(null);
        }}
        locationName={reviewLocation?.name}
        onSubmit={async (payload) => {
          if (!reviewLocation) return;
          await mapMutations.createReview({ locationId: reviewLocation.id, payload });
        }}
      />
    </div>
  );
};

