import { cn } from "@/lib/utils";

type ProgressProps = Omit<React.ComponentPropsWithoutRef<"progress">, "value" | "max"> & {
  value?: number | null;
  max?: number;
};

function Progress({ className, value = 0, max = 100, ...props }: ProgressProps) {
  const normalized = Math.min(max, Math.max(0, value ?? 0));
  return <progress data-slot="progress" className={cn("maintainr-progress", className)} value={normalized} max={max} {...props} />;
}

export { Progress };
