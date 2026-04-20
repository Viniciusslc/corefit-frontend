import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sectionVariants = cva("rounded-[2rem] border backdrop-blur-xl", {
  variants: {
    tone: {
      default:
        "border-white/12 bg-[linear-gradient(180deg,rgba(10,12,11,0.94),rgba(8,8,8,0.92))] shadow-[0_24px_90px_rgba(0,0,0,0.46)]",
      hero: "border-white/10 bg-black/18 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-[2px]",
      accent:
        "border-green-500/18 bg-[linear-gradient(180deg,rgba(8,32,17,0.9),rgba(11,14,12,0.94))] shadow-[0_24px_80px_rgba(0,0,0,0.42),0_0_90px_rgba(34,197,94,0.08)]",
      soft: "border-white/10 bg-white/[0.04] shadow-[0_14px_40px_rgba(0,0,0,0.24)]",
    },
    padding: {
      sm: "p-4",
      md: "p-6 sm:p-8",
      lg: "p-7 sm:p-9",
    },
  },
  defaultVariants: {
    tone: "default",
    padding: "md",
  },
});

type SectionProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof sectionVariants>;

export function CFSection({
  className,
  tone,
  padding,
  ...props
}: SectionProps) {
  return <div className={cn(sectionVariants({ tone, padding }), className)} {...props} />;
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-green-500 text-black shadow-[0_0_36px_rgba(34,197,94,0.22)] hover:scale-[1.01] hover:bg-green-400 active:scale-[0.99]",
        secondary:
          "border border-white/12 bg-white/5 text-white hover:scale-[1.01] hover:border-white/20 hover:bg-white/8 active:scale-[0.99]",
        ghost:
          "border border-white/10 bg-black/24 text-white hover:border-white/16 hover:bg-white/[0.06]",
      },
      size: {
        sm: "px-4 py-2.5 text-sm",
        md: "px-5 py-3.5 text-sm",
        lg: "px-6 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function CFButton({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

const inputVariants = cva(
  "w-full rounded-xl border bg-zinc-800/95 px-5 py-4 text-base text-white placeholder:text-zinc-500 transition focus:outline-none focus:ring-2 focus:ring-green-500",
  {
    variants: {
      tone: {
        default: "border-zinc-700",
        subtle: "border-white/10 bg-white/[0.04]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

export function CFInput({
  className,
  tone,
  ...props
}: InputProps) {
  return <input className={cn(inputVariants({ tone, className }))} {...props} />;
}

const badgeVariants = cva(
  "inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]",
  {
    variants: {
      variant: {
        accent: "border-green-500/20 bg-green-500/10 text-green-300",
        neutral: "border-white/10 bg-white/[0.04] text-zinc-300",
        warning: "border-amber-400/20 bg-amber-400/10 text-amber-100",
      },
    },
    defaultVariants: {
      variant: "accent",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function CFBadge({
  className,
  variant,
  ...props
}: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  rightAdornment?: React.ReactNode;
};

export function CFField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  rightAdornment,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm text-green-400">
        {label}
      </label>
      <div className="relative mt-1">
        <CFInput
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={rightAdornment ? "pr-14" : ""}
        />
        {rightAdornment ? (
          <div className="absolute inset-y-0 right-2 flex items-center">{rightAdornment}</div>
        ) : null}
      </div>
    </div>
  );
}
