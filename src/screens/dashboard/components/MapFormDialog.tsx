import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { MapPayload } from "@/services/maps";

type MapFormValues = {
  title: string;
  description: string;
  cover_url: string;
  is_public: boolean;
};

type MapFormDialogProps = {
  trigger?: ReactNode;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onSubmit: (values: MapPayload) => Promise<void>;
  initialValues?: MapPayload & { id?: string };
  actionLabel?: string;
};

export const MapFormDialog = ({
  trigger,
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  actionLabel = "Save map",
}: MapFormDialogProps) => {
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      cover_url: "",
      is_public: false,
    },
  });

  const validate = (values: MapFormValues) => {
    const errors: Partial<Record<keyof MapFormValues, string>> = {};
    if (!values.title.trim()) {
      errors.title = "Name your map";
    }
    if (values.description.length > 400) {
      errors.description = "Keep it concise";
    }
    if (values.cover_url) {
      try {
        // eslint-disable-next-line no-new
        new URL(values.cover_url);
      } catch {
        errors.cover_url = "Must be a valid URL";
      }
    }
    return errors;
  };

  useEffect(() => {
    if (initialValues && open) {
      form.reset({
        title: initialValues.title,
        description: initialValues.description ?? "",
        cover_url: initialValues.cover_url ?? "",
        is_public: initialValues.is_public ?? false,
      });
    } else if (!open) {
      form.reset({ title: "", description: "", cover_url: "", is_public: false });
      form.clearErrors();
    }
  }, [form, initialValues, open]);

  const handleSubmit = async (rawValues: unknown) => {
    const values = rawValues as MapFormValues;
    form.clearErrors();
    const errors = validate(values);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([key, message]) => {
        form.setError(key as keyof MapFormValues, { type: "manual", message });
      });
      return;
    }

    await onSubmit({
      title: values.title,
      description: values.description?.trim() || null,
      cover_url: values.cover_url?.trim() || null,
      is_public: values.is_public,
    });
    onOpenChange(false);
    form.reset({ title: "", description: "", cover_url: "", is_public: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? "Edit map" : "Create a map"}</DialogTitle>
          <DialogDescription>
            Add context for collaborators. You can always update these details later.
          </DialogDescription>
        </DialogHeader>
        <Form {...(form as any)}>
          <form
            className="space-y-4"
            onSubmit={(form.handleSubmit as any)(handleSubmit)}
          >
            <FormField
              control={(form.control as any)}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Favorite coffee shops" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={(form.control as any)}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Describe what this map is about or how to use it."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={(form.control as any)}
              name="cover_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={(form.control as any)}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-dashed border-border/80 px-3 py-3">
                  <div>
                    <FormLabel className="font-medium">Public visibility</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Allow anyone with the link to view this map.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full">
                {actionLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

