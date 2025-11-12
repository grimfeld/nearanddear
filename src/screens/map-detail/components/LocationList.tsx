import {
  CircleDollarSign,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Star,
  Trash,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getLocationCategoryColor,
  getLocationCategoryLabel,
} from "@/lib/mapIcons";

type Location = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  type?: string | null;
  tags?: string[] | null;
  averageRating?: number | null;
  reviewCount?: number;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
  isOpenNow?: boolean;
  googlePlaceId?: string | null;
  website?: string | null;
  phone?: string | null;
  openingHours?: Record<string, { open: string; close: string } | null> | null;
  notes?: string | null;
};

type LocationListProps = {
  locations: Location[];
  canEdit: boolean;
  onEdit: (locationId: string) => void;
  onDelete: (locationId: string) => void;
  onReview: (locationId: string) => void;
};

const getTodayHours = (
  openingHours?: Record<string, { open: string; close: string } | null> | null
) => {
  if (!openingHours) return null;
  const dayKey = new Intl.DateTimeFormat(undefined, { weekday: "long" })
    .format(new Date())
    .toLowerCase();
  const hours = openingHours[dayKey];
  if (!hours || !hours.open || !hours.close) return null;
  return `${hours.open} – ${hours.close}`;
};

const getPriceIndicator = (tags?: string[] | null, notes?: string | null) => {
  const tagMatch = tags?.find((tag) => /^[$€£]{1,4}$/.test(tag.trim()))?.trim();
  if (tagMatch) return tagMatch;
  if (notes) {
    const match = notes.match(/([$€£]{1,4})/);
    if (match) return match[1];
  }
  return null;
};

const getHostname = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return url;
  }
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
                const categoryColor = getLocationCategoryColor(location.type);
                const categoryLabel = getLocationCategoryLabel(location.type);
                const todayHours = getTodayHours(location.openingHours);
                const priceIndicator = getPriceIndicator(location.tags, location.notes);
                const distanceDisplay =
                  location.distanceKm != null ? `${location.distanceKm.toFixed(1)} km away` : null;

                return (
                  <div
                    key={location.id}
                    className="rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">
                            {location.name}
                          </h3>
                          {location.isOpenNow ? (
                            <Badge variant="success">Open now</Badge>
                          ) : todayHours ? (
                            <Badge variant="warning">Closed now</Badge>
                          ) : null}
                          <Badge
                            variant="outline"
                            className="border-0 text-xs font-semibold"
                            style={{
                              backgroundColor: `${categoryColor}22`,
                              color: "#111827",
                            }}
                          >
                            {categoryLabel}
                          </Badge>
                          {priceIndicator ? (
                            <Badge className="border border-amber-200 bg-amber-100 text-amber-700">
                              {priceIndicator}
                            </Badge>
                          ) : null}
                        </div>
                        {location.description ? (
                          <p className="text-sm text-muted-foreground">{location.description}</p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            {location.averageRating ? location.averageRating.toFixed(1) : "—"}
                            <span className="text-[10px]">({location.reviewCount ?? 0})</span>
                          </span>
                          {distanceDisplay ? (
                            <span className="inline-flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              {distanceDisplay}
                            </span>
                          ) : null}
                          {location.tags?.map((tag) => (
                            <Badge key={tag} variant="outline">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      {location.address ? (
                        <div className="inline-flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-foreground/70" />
                          <span>{location.address}</span>
                        </div>
                      ) : null}
                      {todayHours ? (
                        <div className="inline-flex items-center gap-2">
                          <Clock className="h-3 w-3 text-foreground/70" />
                          <span>{todayHours}</span>
                        </div>
                      ) : null}
                      {location.phone ? (
                        <div className="inline-flex items-center gap-2">
                          <Phone className="h-3 w-3 text-foreground/70" />
                          <span>{location.phone}</span>
                        </div>
                      ) : null}
                      {location.website ? (
                        <div className="inline-flex items-center gap-2">
                          <Globe className="h-3 w-3 text-foreground/70" />
                          <a
                            href={location.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground"
                          >
                            {getHostname(location.website)}
                          </a>
                        </div>
                      ) : null}
                      {priceIndicator ? (
                        <div className="inline-flex items-center gap-2">
                          <CircleDollarSign className="h-3 w-3 text-foreground/70" />
                          <span>{priceIndicator}</span>
                        </div>
                      ) : null}
                    </div>
                    {location.notes ? (
                      <p className="mt-3 text-xs italic text-muted-foreground/80">{location.notes}</p>
                    ) : null}
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

