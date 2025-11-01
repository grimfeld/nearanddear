import { Link } from "react-router-dom";
import { CalendarClock, MapPinned, Pencil, Trash } from "lucide-react";

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
import { formatRelative } from "date-fns";

type MapCardProps = {
  map: MapRecord;
  onEdit: (map: MapRecord) => void;
  onDelete: (map: MapRecord) => void;
};

export const MapCard = ({ map, onEdit, onDelete }: MapCardProps) => {
  const updatedRelative = formatRelative(new Date(map.updated_at), new Date());

  return (
    <Card className="flex h-full flex-col border-border/80 bg-background/80">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPinned className="h-5 w-5 text-muted-foreground" />
          {map.title}
        </CardTitle>
        {map.description && (
          <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
            {map.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">{map.member_role === "owner" ? "Owner" : "Collaborator"}</Badge>
          <Badge variant="outline">{map.is_public ? "Public" : "Private"}</Badge>
          <Badge variant="outline">{map.location_count ?? 0} locations</Badge>
          <Badge variant="outline">
            {map.average_rating ? `${map.average_rating.toFixed(1)}★ avg` : "No reviews yet"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <CalendarClock className="h-4 w-4" /> Updated {updatedRelative}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => onEdit(map)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/app/maps/${map.id}`}>Open map</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onDelete(map)}
          >
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

