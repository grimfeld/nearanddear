import { ExternalLink, MapPin, Pencil, Star, Trash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

type Location = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  type?: string | null;
  tags?: string[] | null;
  averageRating?: number | null;
  reviewCount?: number;
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    author?: string | null;
    createdAt: string;
  }>;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
  isOpenNow?: boolean;
  googlePlaceId?: string | null;
};

type LocationListProps = {
  locations: Location[];
  canEdit: boolean;
  onEdit: (locationId: string) => void;
  onDelete: (locationId: string) => void;
  onReview: (locationId: string) => void;
};

export const LocationList = ({ locations, canEdit, onEdit, onDelete, onReview }: LocationListProps) => {
  return (
    <Card className="h-full border-border/80 bg-background/80">
      <CardHeader>
        <CardTitle className="text-lg">Locations</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[420px] pr-3">
          <div className="space-y-3 pt-4">
            {locations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                No locations yet. Add your first place to get started.
              </div>
            ) : (
              locations.map((location) => {
                const googleLink = location.googlePlaceId
                  ? `https://www.google.com/maps/place/?q=place_id:${location.googlePlaceId}`
                  : `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
                return (
                  <div
                    key={location.id}
                    className="rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            {location.name}
                          </h3>
                          {location.isOpenNow ? (
                            <Badge variant="success">Open now</Badge>
                          ) : null}
                        </div>
                        {location.description ? (
                          <p className="text-sm text-muted-foreground">
                            {location.description}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {location.type ? <Badge variant="outline">{location.type}</Badge> : null}
                          {location.tags?.map((tag) => (
                            <Badge variant="outline" key={tag}>
                              #{tag}
                            </Badge>
                          ))}
                          {location.distanceKm != null ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {location.distanceKm.toFixed(1)} km
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            {location.averageRating ? location.averageRating.toFixed(1) : "—"}
                            <span className="text-[10px]">({location.reviewCount ?? 0})</span>
                          </span>
                        </div>
                        {location.address ? (
                          <p className="text-xs text-muted-foreground">{location.address}</p>
                        ) : null}
                        {location.reviews && location.reviews.length > 0 ? (
                          <div className="mt-2 space-y-1 rounded-lg bg-muted/50 p-2">
                            {location.reviews.slice(0, 2).map((review) => (
                              <p key={review.id} className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {review.author ?? "Anonymous"}
                                </span>{" "}
                                rated {review.rating}★ – {review.comment ?? "No comment"}
                              </p>
                            ))}
                            {location.reviewCount && location.reviewCount > 2 ? (
                              <p className="text-[11px] text-muted-foreground/80">
                                +{location.reviewCount - 2} more review(s)
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <CardFooter className="mt-3 flex flex-wrap items-center gap-2 px-0">
                      <Button variant="outline" size="sm" asChild>
                        <a href={googleLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" /> Open in Google Maps
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onReview(location.id)}>
                        <Star className="mr-2 h-4 w-4" /> Review
                      </Button>
                      {canEdit ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => onEdit(location.id)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => onDelete(location.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </>
                      ) : null}
                    </CardFooter>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

