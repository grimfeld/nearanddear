import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { MapFormDialog } from "@/screens/dashboard/components/MapFormDialog";
import { MapCard } from "@/screens/dashboard/components/MapCard";
import { useMaps } from "@/hooks/useMaps";
import type { MapRecord } from "@/types/models";

export const DashboardPage = () => {
  const { data: maps, isLoading, createMap, updateMap, deleteMap } = useMaps();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeMap, setActiveMap] = useState<MapRecord | null>(null);
  const [search, setSearch] = useState("");

  const filteredMaps = useMemo(() => {
    if (!maps) return [];
    if (!search.trim()) return maps;
    return maps.filter((map) =>
      [map.title, map.description ?? ""].some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [maps, search]);

  const handleCreate = () => {
    setActiveMap(null);
    setDialogOpen(true);
  };

  const handleEdit = (map: MapRecord) => {
    setActiveMap(map);
    setDialogOpen(true);
  };

  const handleDelete = async (map: MapRecord) => {
    const confirmed = window.confirm(`Delete map “${map.title}”? This cannot be undone.`);
    if (!confirmed) return;
    await deleteMap(map.id);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your collaborative maps</h1>
          <p className="text-sm text-muted-foreground">
            Manage shared guides, invite collaborators, and keep every location up to date.
          </p>
        </div>
        <Button onClick={handleCreate} className="inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New map
        </Button>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{maps?.length ?? 0} total maps</span>
          {maps && filteredMaps.length !== maps.length && (
            <span>• showing {filteredMaps.length}</span>
          )}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search maps"
          className="w-full sm:w-64"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filteredMaps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-background/60 px-12 py-16 text-center">
          <Spinner />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">No maps yet</h2>
            <p className="text-sm text-muted-foreground">
              Create your first shared map to start adding locations and inviting collaborators.
            </p>
          </div>
          <Button onClick={handleCreate} size="sm">
            Create map
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMaps.map((map) => (
            <MapCard key={map.id} map={map} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <MapFormDialog
        trigger={null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValues={activeMap ?? undefined}
        onSubmit={async (values) => {
          if (activeMap) {
            await updateMap({ mapId: activeMap.id, payload: values });
          } else {
            await createMap(values);
          }
        }}
        actionLabel={activeMap ? "Update map" : "Create map"}
      />
    </div>
  );
};

