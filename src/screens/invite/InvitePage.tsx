import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/AuthProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import type { MapRecord } from "@/types/models";

type InviteDetails = {
  map_id: string;
  role: MapRecord["member_role"];
  map_title: string;
  expires_at: string | null;
  is_active: boolean;
};

type FetchState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "ready"; details: InviteDetails }
  | { status: "error"; message: string };

export const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const supabase = useSupabase();

  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (!token) {
      setFetchState({ status: "invalid" });
      return;
    }

    let isMounted = true;

    const loadInvite = async () => {
      const { data, error } = await supabase.rpc("get_map_invite_details", {
        invite_token: token,
      });

      if (!isMounted) return;

      if (error) {
        setFetchState({
          status: "error",
          message:
            error.message ??
            "We couldn't load this invite. The link may be invalid or expired.",
        });
        return;
      }

      const details = Array.isArray(data) ? (data[0] as InviteDetails | undefined) : null;

      if (!details) {
        setFetchState({ status: "invalid" });
        return;
      }

      setFetchState({ status: "ready", details });
    };

    void loadInvite();

    return () => {
      isMounted = false;
    };
  }, [supabase, token]);

  const details = fetchState.status === "ready" ? fetchState.details : null;

  const handleRedeem = useCallback(async () => {
    if (!token || !details) return;

    try {
      setIsRedeeming(true);
      const { data, error } = await supabase.rpc("redeem_map_invite", {
        invite_token: token,
      });

      if (error) {
        toast.error(error.message ?? "We couldn't add you to the map.");
        return;
      }

      const membership = data as { map_id?: string } | null;

      toast.success("You're now a collaborator on this map!");

      const mapId = membership?.map_id ?? details.map_id;
      localStorage.removeItem("pendingInviteToken");
      navigate(`/app/maps/${mapId}`, { replace: true });
    } catch (redeemError) {
      const message =
        redeemError instanceof Error
          ? redeemError.message
          : "We couldn't add you to the map.";
      toast.error(message);
    } finally {
      setIsRedeeming(false);
    }
  }, [details, navigate, supabase, token]);

  useEffect(() => {
    if (!token || !details || !user || isRedeeming) return;
    const pendingToken = localStorage.getItem("pendingInviteToken");
    if (pendingToken && pendingToken === token) {
      void handleRedeem();
    }
  }, [details, handleRedeem, isRedeeming, token, user]);

  const roleDescription = useMemo(() => {
    if (!details) return "";
    switch (details.role) {
      case "editor":
        return "Editors can add and update locations.";
      case "owner":
        return "Owners can manage every aspect of the map.";
      default:
        return "Viewers can explore the map and leave reviews.";
    }
  }, [details]);

  if (fetchState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading invite…</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchState.status === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-16">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Invite not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This invite link is no longer active. Ask the map owner for a fresh invite link.
            </p>
            <Button asChild>
              <Link to="/">Return home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchState.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-16">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>We hit a snag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{fetchState.message}</p>
            <Button asChild>
              <Link to="/">Return home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Join “{details.map_title}”</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            You’ve been invited to collaborate on this map as a <strong>{details.role}</strong>.
          </p>
          <p className="text-muted-foreground">{roleDescription}</p>
          {details.expires_at ? (
            <p className="text-xs text-muted-foreground">
              This link expires {new Date(details.expires_at).toLocaleString()}.
            </p>
          ) : null}
          {user ? (
            <Button className="w-full" disabled={isRedeeming} onClick={handleRedeem}>
              {isRedeeming ? "Joining…" : "Join map"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  if (!token) return;
                  localStorage.setItem("pendingInviteToken", token);
                  navigate("/auth", {
                    state: { from: location },
                  });
                }}
              >
                Sign in to continue
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                We’ll guide you through creating an account if you’re new to Near &amp; Dear.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

