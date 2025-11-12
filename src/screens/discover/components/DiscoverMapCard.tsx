import { Link } from "react-router-dom";
import { CalendarClock, Heart, MapPinned, Star, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MapRecord } from "@/types/models";
import { cn } from "@/lib/utils";

type DiscoverMapCardProps = {
  map: MapRecord;
  onToggleFavorite: (map: MapRecord) => void;
  isMutating?: boolean;
};

export const DiscoverMapCard = ({
  map,
  onToggleFavorite,
  isMutating = false,
}: DiscoverMapCardProps) => {
  const favoriteCount = map.favorite_count ?? 0;
  const locationCount = map.location_count ?? 0;
  const averageRating = map.average_rating ?? 0;
  const isFavorite = map.is_favorite ?? false;

  const ownerName = map.owner?.display_name ?? "Community member";
  const ownerAvatar = map.owner?.avatar_url ?? undefined;
  const ownerInitials =
    ownerName
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "M";

  return (
    <Card className="flex h-full flex-col border-border/80 bg-background/90 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-muted/60 p-3 text-primary">
            <MapPinned className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">{map.title}</CardTitle>
            {map.description ? (
              <CardDescription className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {map.description}
              </CardDescription>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-border/60">
            <AvatarImage src={ownerAvatar} alt={ownerName} />
            <AvatarFallback>{ownerInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col text-sm">
            <span className="font-medium text-foreground">{ownerName}</span>
            <span className="text-xs text-muted-foreground">Curated map owner</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="bg-background/60">
            Public map
          </Badge>
          <Badge variant="outline" className="bg-background/60">
            {locationCount} locations
          </Badge>
          <Badge variant="outline" className="bg-background/60">
            {favoriteCount} favorites
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs">
            <Heart
              className={cn("h-4 w-4", isFavorite ? "text-rose-500" : "text-muted-foreground")}
              fill={isFavorite ? "currentColor" : "none"}
            />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{favoriteCount}</span>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Saves
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs">
            <Star className="h-4 w-4 text-yellow-500" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">
                {averageRating ? averageRating.toFixed(1) : "—"}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Avg rating
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            Collaborative guide curated by passionate locals and explorers.
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <Button
          variant={isFavorite ? "secondary" : "outline"}
          size="sm"
          className="inline-flex items-center gap-2"
          disabled={isMutating}
          onClick={() => onToggleFavorite(map)}
        >
          <Heart
            className={cn("h-4 w-4", isFavorite ? "text-rose-500" : "text-muted-foreground")}
            fill={isFavorite ? "currentColor" : "none"}
          />
          {isFavorite ? "Saved" : "Save to favorites"}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/app/maps/${map.id}`} className="inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Open map
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

