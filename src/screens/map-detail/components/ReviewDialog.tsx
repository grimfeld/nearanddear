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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewPayload } from "@/services/reviews";

type ReviewFormValues = {
  rating: number;
  comment: string;
  visitedAt: string;
};

type ReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ReviewPayload) => Promise<void>;
  locationName?: string;
};

export const ReviewDialog = ({ open, onOpenChange, onSubmit, locationName }: ReviewDialogProps) => {
  const form = useForm<ReviewFormValues>({
    defaultValues: { rating: 5, comment: "", visitedAt: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ rating: 5, comment: "", visitedAt: "" });
      form.clearErrors();
    }
  }, [form, open]);

  const handleSubmit = async (values: ReviewFormValues) => {
    form.clearErrors();

    if (values.rating < 1 || values.rating > 5) {
      form.setError("rating", { type: "manual", message: "Rating must be between 1 and 5" });
      return;
    }

    if (values.comment.length > 600) {
      form.setError("comment", { type: "manual", message: "Comment is too long" });
      return;
    }

    await onSubmit({
      rating: values.rating,
      comment: values.comment?.trim() || null,
      visited_at: values.visitedAt || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your thoughts</DialogTitle>
          <DialogDescription>
            Help collaborators understand what makes {locationName ?? "this place"} worth a visit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 4, 3, 2, 1].map((value) => (
                          <SelectItem key={value} value={value.toString()}>
                            {value} star{value > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="What stood out?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visitedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visited on</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="w-full">
                Submit review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

