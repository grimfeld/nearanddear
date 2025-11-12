import { useMemo, useState } from "react";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { DiscoverMapCard } from "@/screens/discover/components/DiscoverMapCard";
import { useDiscoverMaps } from "@/hooks/useDiscoverMaps";
import type { MapRecord } from "@/types/models";

export const DiscoverPage = () => {
  const {
    data: maps,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
    toggleFavorite,
    isTogglingFavorite,
  } = useDiscoverMaps();
  const [search, setSearch] = useState("");

  const filteredMaps = useMemo(() => {
    if (!maps) return [];
    if (!search.trim()) return maps;
    return maps.filter((map) =>
      [map.title, map.description ?? "", map.owner?.display_name ?? ""].some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [maps, search]);

  const errorMessage =
    error instanceof Error ? error.message : "Please refresh the page and try again.";

  const handleToggleFavorite = async (map: MapRecord) => {
    await toggleFavorite({ mapId: map.id, isFavorite: map.is_favorite ?? false });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Discover community maps
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore curated public guides from the Near & Dear community and save your favorites
              for quick access.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{maps?.length ?? 0} public maps</span>
          {maps && filteredMaps.length !== maps.length ? (
            <span>• showing {filteredMaps.length}</span>
          ) : null}
          {isFetching ? <span>• updating…</span> : null}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search maps or creators"
          className="w-full sm:w-72"
        />
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-12 py-16 text-center text-destructive">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Unable to load discover maps</h2>
            <p className="text-sm opacity-80">{errorMessage}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : filteredMaps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-background/60 px-12 py-16 text-center">
          <Spinner />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">No maps found</h2>
            <p className="text-sm text-muted-foreground">
              Try a different search term or check back soon for new community guides.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMaps.map((map) => (
            <DiscoverMapCard
              key={map.id}
              map={map}
              isMutating={isTogglingFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

