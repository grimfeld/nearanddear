import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export const Spinner = ({ size = "md", className }: SpinnerProps) => (
  <span
    className={cn(
      "inline-block animate-spin rounded-full border-2 border-muted border-t-primary",
      sizeMap[size],
      className
    )}
  />
);

