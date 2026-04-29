import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

const aiNudgeVariants = cva(
  "relative flex items-center gap-4 rounded-lg border p-4 shadow-sm md:flex-row",
  {
    variants: {
      variant: {
        default: "bg-ai-nudge-background text-ai-nudge-foreground border-ai-nudge-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AiNudgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof aiNudgeVariants> {
  open: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  dismissible?: boolean;
}

const AiNudge = React.forwardRef<HTMLDivElement, AiNudgeProps>(
  (
    {
      className,
      variant,
      open,
      onClose,
      icon,
      title,
      description,
      action,
      dismissible = true,
      ...props
    },
    ref,
  ) => (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            aiNudgeVariants({ variant }),
            "flex-col justify-between",
            className,
          )}
          {...props}
        >
          <div className="flex items-start gap-4">
            {icon && <div className="flex-shrink-0 text-2xl">{icon}</div>}
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-none tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-ai-nudge-foreground/80">
                {description}
              </p>
              {action && <div className="mt-4">{action}</div>}
            </div>
          </div>
          {dismissible && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  ),
);
AiNudge.displayName = "AiNudge";

export { AiNudge, aiNudgeVariants };
