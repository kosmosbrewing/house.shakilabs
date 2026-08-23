import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-caption font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // The deduction and highlight variants are gone: the theme defines no
        // colour under those names, so their background and text utilities never
        // produced a CSS rule. Nothing used them, but leaving them in means the
        // next person who picks one ships a badge with nothing painted at all.
        // 반투명 회색 위 흰 글자는 라이트 3.37:1·다크 3.47:1로 양쪽 다 미달이었다.
        // 불투명 --muted-foreground 위 --background로 바꿔 6.51:1·8.64:1이 된다.
        neutral: "border-border/50 bg-muted-foreground text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

export { default as Badge } from "./Badge.vue";
