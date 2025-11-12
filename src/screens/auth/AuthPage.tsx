import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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

const otpSchema = z
  .string()
  .length(6, "One-time code must be 6 digits")
  .regex(/^\d+$/, "One-time code must only contain digits");

const authSchema = z.object({
  email: z.string().email("Please provide a valid email"),
  otp: z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim().length === 0
          ? undefined
          : value,
      otpSchema
    )
    .optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const AuthPage = () => {
  const { user } = useAuth();
  const supabase = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from =
    (location.state as { from?: Location })?.from?.pathname ?? "/app/dashboard";

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleRequestCode = async ({ email }: Pick<AuthFormValues, "email">) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Check your inbox", {
        description:
          "Enter the 6-digit code from your email to finish signing in.",
      });

      form.setValue("otp", "");
      setStep("verify");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async ({
    email,
    otp,
  }: AuthFormValues) => {
    if (!otp) {
      form.setError("otp", {
        type: "manual",
        message: "Enter the 6-digit code we sent to your email",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.session) {
        toast.error("Invalid session", {
          description: "Please request a new code and try again.",
        });
        setStep("request");
        form.setValue("otp", "");
        return;
      }

      toast.success("You're in!", {
        description: "Redirecting to your workspace.",
      });

      navigate(from, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: AuthFormValues) => {
    if (step === "request") {
      await handleRequestCode({
        email: values.email,
      });
      return;
    }

    await handleVerifyCode(values);
  };

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <AuthLayout
      heading="Welcome"
      subheading="Enter your email to sign in or create an account."
      footer={
        <span>
          Continue to verify ownership of your email address with a one-time
          code.
        </span>
      }
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={step === "verify"}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {step === "verify" ? (
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>One-time code</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      autoComplete="one-time-code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Spinner size="sm" />{" "}
                {step === "verify" ? "Verifying" : "Sending code"}
              </div>
            ) : step === "verify" ? (
              "Verify code"
            ) : (
              "Send sign-in code"
            )}
          </Button>
          {step === "verify" ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                void (async () => {
                  const isValid = await form.trigger(["email"]);
                  if (!isValid) return;
                  const { email } = form.getValues();
                  await handleRequestCode({ email });
                })();
              }}
              disabled={isSubmitting}
            >
              Resend code
            </Button>
          ) : null}
        </form>
      </Form>
    </AuthLayout>
  );
};


