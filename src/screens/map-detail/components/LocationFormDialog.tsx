import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Combobox } from "@/components/ui/combobox";
import type { LocationPayload } from "@/services/locations";
import { AddressSearchInput, type GeocodingResult } from "@/components/AddressSearchInput";
import { TagInput } from "@/components/TagInput";
import { LOCATION_CATEGORIES, getCategoryValue } from "@/lib/locationCategories";

const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;

const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

type LocationFormValues = {
  name: string;
  description: string;
  address: string;
  type: string;
  tags: string[];
  latitude: string;
  longitude: string;
  website: string;
  phone: string;
  googlePlaceId: string;
  notes: string;
  dailyOpen: string;
  dailyClose: string;
};

type LocationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: LocationPayload) => Promise<void>;
  initialValues?: LocationPayload & { id?: string };
  mapId: string;
};

export const LocationFormDialog = ({ open, onOpenChange, onSubmit, initialValues, mapId }: LocationFormDialogProps) => {
  const form = useForm<LocationFormValues>({
    defaultValues: {
      name: "",
      description: "",
      address: "",
      type: "",
      tags: [],
      latitude: "",
      longitude: "",
      phone: "",
      website: "",
      googlePlaceId: "",
      notes: "",
      dailyOpen: "",
      dailyClose: "",
    },
  });

  const validate = (values: LocationFormValues) => {
    const errors: Partial<Record<keyof LocationFormValues, string>> = {};
    const latitude = Number(values.latitude);
    const longitude = Number(values.longitude);

    if (!values.name.trim()) {
      errors.name = "Give the place a name";
    }

    if (Number.isNaN(latitude)) {
      errors.latitude = "Latitude must be a number";
    } else if (latitude < -90 || latitude > 90) {
      errors.latitude = "Latitude must be between -90 and 90";
    }

    if (Number.isNaN(longitude)) {
      errors.longitude = "Longitude must be a number";
    } else if (longitude < -180 || longitude > 180) {
      errors.longitude = "Longitude must be between -180 and 180";
    }

    if (values.website) {
      try {
        // eslint-disable-next-line no-new
        new URL(values.website);
      } catch {
        errors.website = "Enter a valid URL";
      }
    }

    if (values.dailyOpen && !timePattern.test(values.dailyOpen)) {
      errors.dailyOpen = "Use HH:MM format";
    }

    if (values.dailyClose && !timePattern.test(values.dailyClose)) {
      errors.dailyClose = "Use HH:MM format";
    }

    return { errors, latitude, longitude };
  };

  useEffect(() => {
    if (open && initialValues) {
      form.reset({
        name: initialValues.name,
        description: initialValues.description ?? "",
        address: initialValues.address ?? "",
        type: initialValues.type ?? "",
        tags: initialValues.tags?.map((tag) => tag.toLowerCase()) ?? [],
        latitude: initialValues.latitude.toString(),
        longitude: initialValues.longitude.toString(),
        phone: initialValues.phone ?? "",
        website: initialValues.website ?? "",
        googlePlaceId: initialValues.google_place_id ?? "",
        notes: initialValues.notes ?? "",
        dailyOpen: initialValues.opening_hours
          ? ((initialValues.opening_hours as Record<string, { open: string; close: string } | null>)["monday"]?.open ?? "")
          : "",
        dailyClose: initialValues.opening_hours
          ? ((initialValues.opening_hours as Record<string, { open: string; close: string } | null>)["monday"]?.close ?? "")
          : "",
      });
    } else if (!open) {
      form.reset();
      form.clearErrors();
    }
  }, [form, initialValues, open]);

  const handleSubmit = async (values: LocationFormValues) => {
    form.clearErrors();

    const { errors, latitude, longitude } = validate(values);

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([key, message]) => {
        form.setError(key as keyof LocationFormValues, { type: "manual", message });
      });
      return;
    }

    const hasHours = values.dailyOpen && values.dailyClose;
    const opening_hours = hasHours
      ? days.reduce<Record<string, { open: string; close: string }>>((acc, day) => {
          acc[day] = { open: values.dailyOpen!, close: values.dailyClose! };
          return acc;
        }, {})
      : null;

    await onSubmit({
      name: values.name,
      description: values.description?.trim() || null,
      address: values.address?.trim() || null,
      latitude,
      longitude,
      type: values.type?.trim() || null,
      tags: values.tags.length > 0 ? values.tags : null,
      website: values.website?.trim() || null,
      phone: values.phone?.trim() || null,
      google_place_id: values.googlePlaceId?.trim() || null,
      notes: values.notes?.trim() || null,
      opening_hours,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialValues ? "Update location" : "Add a location"}</DialogTitle>
          <DialogDescription>
            Provide details to help collaborators understand why this place matters.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Central Cafe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Why is this place special?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <AddressSearchInput
                      placeholder="123 Main Street"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value)}
                      onSelectResult={(result: GeocodingResult) => {
                        const latitude = Number.parseFloat(result.lat);
                        const longitude = Number.parseFloat(result.lon);
                        form.setValue("address", result.display_name, { shouldDirty: true });
                        if (!Number.isNaN(latitude)) {
                          form.setValue("latitude", latitude.toFixed(6), { shouldDirty: true });
                          form.clearErrors("latitude");
                        }
                        if (!Number.isNaN(longitude)) {
                          form.setValue("longitude", longitude.toFixed(6), { shouldDirty: true });
                          form.clearErrors("longitude");
                        }
                        form.clearErrors("address");

                        if (!form.getValues("type") && result.type) {
                          const categoryValue = getCategoryValue(result.type);
                          if (categoryValue) {
                            form.setValue("type", categoryValue, { shouldDirty: true });
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Combobox
                    options={[
                      { value: "", label: "No category" },
                      ...LOCATION_CATEGORIES,
                    ]}
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    placeholder="Select a category"
                    emptyMessage="No categories found"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      mapId={mapId}
                      placeholder="Add tags..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input placeholder="40.741" type="number" step="0.000001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input placeholder="-73.989" type="number" step="0.000001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="googlePlaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google place ID</FormLabel>
                  <FormControl>
                    <Input placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Internal notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Shared planning notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dailyOpen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily open</FormLabel>
                  <FormControl>
                    <Input placeholder="08:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dailyClose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily close</FormLabel>
                  <FormControl>
                    <Input placeholder="22:00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="md:col-span-2">
              <Button type="submit" className="w-full">
                {initialValues ? "Save changes" : "Add location"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

