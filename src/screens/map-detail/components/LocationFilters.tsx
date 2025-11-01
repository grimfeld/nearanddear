import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { LocationFilters as LocationFiltersState } from "@/types/models";
import { MapPin } from "lucide-react";

type LocationFiltersProps = {
  filters: LocationFiltersState;
  onChange: (next: LocationFiltersState) => void;
  availableTypes: string[];
  onRequestLocation: () => void;
  geoStatus: {
    hasLocation: boolean;
    isLoading: boolean;
    error?: string | null;
  };
};

export const LocationFilters = ({
  filters,
  onChange,
  availableTypes,
  onRequestLocation,
  geoStatus,
}: LocationFiltersProps) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...filters, search: event.target.value });

  const handleTypeChange = (value: string) => {
    onChange({ ...filters, types: value ? [value] : [] });
  };

  const handleSortChange = (value: LocationFiltersState["sort"]) => {
    onChange({ ...filters, sort: value });
  };

  const handleRadiusChange = (value: string) => {
    onChange({ ...filters, radiusKm: value ? Number(value) : null });
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-border/80 bg-background/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Name or keywords"
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      <div className="space-y-1">
        <Label>Category</Label>
        <Select value={filters.types[0] ?? ""} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Sort by</Label>
        <Select value={filters.sort} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
            <SelectItem value="recent">Recently added</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Open now</Label>
            <p className="text-xs text-muted-foreground">Show places currently open</p>
          </div>
          <Switch
            checked={filters.openNow}
            onCheckedChange={(checked) => onChange({ ...filters, openNow: checked })}
          />
        </div>
        <div className="space-y-1">
          <Label>Radius</Label>
          <Select value={filters.radiusKm?.toString() ?? ""} onValueChange={handleRadiusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Any distance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any distance</SelectItem>
              <SelectItem value="5">Within 5 km</SelectItem>
              <SelectItem value="10">Within 10 km</SelectItem>
              <SelectItem value="25">Within 25 km</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 inline-flex items-center gap-2"
            onClick={onRequestLocation}
            disabled={geoStatus.isLoading}
          >
            <MapPin className="h-4 w-4" />
            {geoStatus.hasLocation ? "Update location" : "Use my location"}
          </Button>
          {geoStatus.error ? (
            <p className="text-xs text-destructive">{geoStatus.error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

