/**
 * Skeleton – calm loading placeholder primitives.
 *
 * Usage:
 *   <Skeleton className="h-6 w-32" />          // arbitrary block
 *   <Skeleton.Text lines={3} />                 // paragraph-like lines
 *   <Skeleton.Card className="h-40" />          // rounded card surface
 *   <Skeleton.Avatar size="md" />               // circular avatar
 */

import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

// ---------------------------------------------------------------------------
// Base pulse block
// ---------------------------------------------------------------------------
interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Extra Tailwind classes for sizing / shape */
  className?: string;
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-pulse rounded-lg bg-surface-container-high",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Text – stacked lines that mimic a paragraph
// ---------------------------------------------------------------------------
interface TextProps {
  lines?: number;
  className?: string;
}

function Text({ lines = 2, className }: TextProps) {
  return (
    <div className={clsx("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            "h-3",
            // Last line is shorter to look natural
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card – a rounded surface placeholder
// ---------------------------------------------------------------------------
interface CardProps {
  className?: string;
}

function Card({ className }: CardProps) {
  return <Skeleton className={clsx("w-full rounded-[24px]", className)} />;
}

// ---------------------------------------------------------------------------
// Avatar – circular placeholder
// ---------------------------------------------------------------------------
const AVATAR_SIZES = {
  sm: "w-8 h-8",
  md: "w-11 h-11",
  lg: "w-14 h-14",
} as const;

interface AvatarProps {
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}

function Avatar({ size = "md", className }: AvatarProps) {
  return (
    <Skeleton
      className={clsx(
        "rounded-full flex-shrink-0",
        AVATAR_SIZES[size],
        className,
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Attach sub-components
// ---------------------------------------------------------------------------
Skeleton.Text = Text;
Skeleton.Card = Card;
Skeleton.Avatar = Avatar;

export default Skeleton;
