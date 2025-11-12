import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CircleDashed,
  Compass,
  Map,
  Sparkles,
  Users2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";
import type { Profile } from "@/types/models";

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  required?: boolean;
};

type TourItem = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  Icon: typeof Compass;
};

const MIN_DISPLAY_NAME_LENGTH = 2;

const hasValue = (value: string | string[] | null | undefined) => {
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.some((item) => item.trim().length > 0);
  }
  return value.trim().length > 0;
};

const getProfileChecklist = (profile: Profile | null): ChecklistItem[] => {
  const displayNameComplete =
    hasValue(profile?.display_name) &&
    (profile?.display_name?.trim().length ?? 0) >= MIN_DISPLAY_NAME_LENGTH;

  const avatarComplete = hasValue(profile?.avatar_url ?? undefined);

  const bioComplete = hasValue(profile?.bio ?? undefined);
  const cityComplete = hasValue(profile?.city ?? undefined);
  const interestsComplete = hasValue(profile?.favorite_tags ?? undefined);

  return [
    {
      id: "display_name",
      label: "Add your display name",
      description: "Introduce yourself to collaborators with a friendly name.",
      complete: displayNameComplete,
      required: true,
    },
    {
      id: "avatar",
      label: "Add a profile photo",
      description: "Upload an avatar to help others recognize you quickly.",
      complete: avatarComplete,
    },
    {
      id: "bio",
      label: "Write a short bio",
      description: "Share a quick personal note to set expectations.",
      complete: bioComplete,
    },
    {
      id: "city",
      label: "Set your home base",
      description: "Let people know where you explore from most often.",
      complete: cityComplete,
    },
    {
      id: "interests",
      label: "Pick a few interests",
      description: "Add favorite tags to get better map recommendations.",
      complete: interestsComplete,
    },
  ];
};

const isProfileComplete = (profile: Profile | null) =>
  getProfileChecklist(profile)
    .filter((item) => item.required)
    .every((item) => item.complete);

export const OnboardingModal = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [skipForSession, setSkipForSession] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "tour">("profile");

  const checklist = useMemo(() => getProfileChecklist(profile), [profile]);
  const requiredChecklist = useMemo(
    () => checklist.filter((item) => item.required),
    [checklist]
  );
  const completedCount = useMemo(
    () => requiredChecklist.filter((item) => item.complete).length,
    [requiredChecklist]
  );
  const totalRequiredCount = requiredChecklist.length;
  const profileComplete = isProfileComplete(profile);

  useEffect(() => {
    setSkipForSession(false);
  }, [profile?.id]);

  const shouldShow = !loading && !profileComplete && !skipForSession;

  useEffect(() => {
    if (shouldShow) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [shouldShow]);

  const handleNavigate = useCallback(
    (path: string) => {
      if (location.pathname !== path) {
        navigate(path);
      }
      setSkipForSession(true);
      setOpen(false);
    },
    [location.pathname, navigate]
  );

  const handleRemindLater = () => {
    setSkipForSession(true);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSkipForSession(true);
    }
    setOpen(nextOpen);
  };

  const tourItems: TourItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        title: "Create your first map",
        description:
          "Curate a personal or collaborative map, then add locations that matter most.",
        actionLabel: "Open dashboard",
        onAction: () => handleNavigate("/app/dashboard"),
        Icon: Map,
      },
      {
        id: "discover",
        title: "Discover curated collections",
        description:
          "Explore community picks to find inspiration and follow new maps.",
        actionLabel: "Browse discover",
        onAction: () => handleNavigate("/app/discover"),
        Icon: Compass,
      },
      {
        id: "collaborate",
        title: "Invite collaborators",
        description:
          "Share maps with friends or teammates and manage access in a few clicks.",
        actionLabel: "Manage invites",
        onAction: () => handleNavigate("/app/profile"),
        Icon: Users2,
      },
    ],
    [handleNavigate]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl border-border/80 bg-background/95 backdrop-blur">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>
              Welcome! Let&apos;s finish setting things up
            </DialogTitle>
          </div>
          <DialogDescription>
            Complete your profile to personalize recommendations, then take a
            quick tour to learn the essentials.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "profile" | "tour")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile setup</TabsTrigger>
            <TabsTrigger value="tour">Guided tour</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-muted/40 px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                Profile essentials {completedCount}/{totalRequiredCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Add a display name so collaborators know who they&apos;re
                working with. Everything else is optional but recommended.
              </p>
            </div>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-lg border border-dashed border-border/60 bg-background/80 px-3 py-3"
                >
                  <div className="mt-0.5">
                    {item.complete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <CircleDashed className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                      {!item.required ? " · Optional" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="tour" className="space-y-4">
            <div className="rounded-lg border border-border/80 bg-muted/40 px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                Explore the main areas
              </p>
              <p className="text-xs text-muted-foreground">
                Jump into the app with these quick starting points.
              </p>
            </div>
            <ul className="space-y-3">
              {tourItems.map(
                ({ id, title, description, actionLabel, onAction, Icon }) => (
                  <li
                    key={id}
                    className="flex flex-col gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="mt-1 h-5 w-5 text-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={onAction}
                    >
                      {actionLabel}
                    </Button>
                  </li>
                )
              )}
            </ul>
          </TabsContent>
        </Tabs>
        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              className="w-full sm:w-auto"
              onClick={() => handleNavigate("/app/profile")}
            >
              Update profile now
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setActiveTab("tour")}
            >
              Show guided tour
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={handleRemindLater}
          >
            Remind me later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
