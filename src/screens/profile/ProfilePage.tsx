import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/AuthProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import type { Database } from "@/types/database";

type ProfileFormValues = {
  displayName: string;
  avatarUrl: string;
  bio: string;
  city: string;
  favoriteTags: string;
};

export const ProfilePage = () => {
  const { profile, user, refreshProfile } = useAuth();
  const supabase = useSupabase();

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      displayName: profile?.display_name ?? "",
      avatarUrl: profile?.avatar_url ?? "",
      bio: profile?.bio ?? "",
      city: profile?.city ?? "",
      favoriteTags: profile?.favorite_tags?.join(", ") ?? "",
    },
  });

  const validate = (values: ProfileFormValues) => {
    const errors: Partial<Record<keyof ProfileFormValues, string>> = {};

    if (!values.displayName.trim() || values.displayName.trim().length < 2) {
      errors.displayName = "Display name must be at least 2 characters";
    }

    if (values.avatarUrl) {
      try {
        // eslint-disable-next-line no-new
        new URL(values.avatarUrl);
      } catch {
        errors.avatarUrl = "Enter a valid URL";
      }
    }

    if (values.bio.length > 240) {
      errors.bio = "Bio must be 240 characters or less";
    }

    if (values.city.length > 120) {
      errors.city = "City must be 120 characters or less";
    }

    return errors;
  };

  const initials = useMemo(() => {
    if (profile?.display_name) {
      return profile.display_name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");
    }
    return user?.email?.charAt(0).toUpperCase() ?? "U";
  }, [profile?.display_name, user?.email]);

  const onSubmit = async (values: ProfileFormValues) => {
    form.clearErrors();

    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([key, message]) => {
        form.setError(key as keyof ProfileFormValues, { type: "manual", message });
      });
      return;
    }

    if (!profile) return;
    const tags = values.favoriteTags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const updatePayload: Database["public"]["Tables"]["profiles"]["Update"] = {
      display_name: values.displayName,
      avatar_url: values.avatarUrl?.trim() || null,
      bio: values.bio?.trim() || null,
      city: values.city?.trim() || null,
      favorite_tags: tags?.length ? tags : null,
    };

    const client = supabase as any;
    const { error } = await client
      .from("profiles")
      .update(updatePayload)
      .eq("id", profile.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profile updated");
    await refreshProfile();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card className="border-border/80 bg-background/80">
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name ?? "User"} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-medium text-foreground">
                {profile?.display_name ?? "Collaborator"}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Form {...form}>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Share a short personal note" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Lisbon, Portugal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="favoriteTags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite tags</FormLabel>
                    <FormControl>
                      <Input placeholder="coffee, live music, parks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <Button type="submit" className="w-full">
                  Update profile
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {profile?.favorite_tags?.length ? (
        <Card className="border-border/80 bg-background/80">
          <CardHeader>
            <CardTitle className="text-base">Interests</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.favorite_tags.map((tag: string) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

