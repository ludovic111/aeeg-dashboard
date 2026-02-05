import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, getInitials } from "@/lib/utils";

const avatarVariants = cva(
  "relative inline-flex items-center justify-center rounded-full border-2 border-[var(--border-color)] bg-brutal-yellow font-black text-black overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  name: string;
}

function Avatar({ className, size, src, name, ...props }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={cn(avatarVariants({ size }), className)} {...props}>
      {src && !imgError ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

export { Avatar, avatarVariants };
