import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthLayout } from "@/screens/auth/AuthLayout";
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
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/providers/AuthProvider";
import { useSupabase } from "@/providers/SupabaseProvider";
import type { Database } from "@/types/database";

const signUpSchema = z
  .object({
    email: z.string().email("Please provide a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    displayName: z
      .string()
      .min(2, "Display name must be at least 2 characters")
      .max(60, "Display name must be under 60 characters"),
  })
  .required();

type SignUpFormValues = z.infer<typeof signUpSchema>;

export const SignUpPage = () => {
  const { user } = useAuth();
  const supabase = useSupabase();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
    },
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          display_name: values.displayName,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    const newUser = data.user;
    if (newUser) {
      const profileInsert: Database["public"]["Tables"]["profiles"]["Insert"] = {
        id: newUser.id,
        email: newUser.email,
        display_name: values.displayName,
      };

      const client = supabase as any;
      const { error: profileError } = await client
        .from("profiles")
        .insert(profileInsert);

      if (profileError) {
        toast.error("Failed to set up profile", {
          description: profileError.message,
        });
      }
    }

    toast.success("Account created", {
      description: "Check your inbox to confirm your email and sign in.",
    });
    navigate("/auth/sign-in", { replace: true });
  };

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <AuthLayout
      heading="Create your account"
      subheading="Collaborate with your team to build beautiful shared maps."
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="font-medium text-foreground">
            Sign in
          </Link>
        </span>
      }
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input placeholder="Map lovers team" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="sm" /> Creating account
              </div>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
};

