---
name: tailwind-design-system
description: >-
  Guides the creation, maintenance, and refactoring of production-ready design systems
  with Tailwind CSS, including design tokens, semantic theming, component variants using CVA,
  compound components, responsive patterns, dark mode, and accessibility. Use whenever
  building or styling UI components, defining themes, or establishing design system conventions.
---

# Tailwind Design System Skill

Build scalable, accessible, and production-ready design systems using Tailwind CSS. This skill establishes the architectural patterns, component hierarchy, token management, and implementation standards for the codebase.

---

## When to Use This Skill

Activate this skill when:
- Creating new UI components or refactoring existing ones
- Defining or extending design tokens, color scales, or typography in CSS
- Implementing dark mode, high-contrast themes, or dynamic color switching
- Setting up component variants with Class Variance Authority (CVA)
- Structuring form inputs, dialogs, cards, or compound components
- Ensuring WCAG-compliant keyboard focus, touch targets, and contrast ratios

---

## Core Concepts

### 1. Design Token Hierarchy

Tokens flow from abstract definitions to concrete component usages:

```text
Brand Tokens (abstract colors, scales)
    └── Semantic Tokens (purpose: background, surface, line, primary, muted)
        └── Component Tokens (specific: button-bg, card-border, chip-text)

Example:
    teal-500 (#4fb8b2) ──► --lagoon (semantic brand accent) ──► .chat-chip-bg
```

### 2. Component Architecture Pipeline

Every design system component should layer styling predictably:

```text
Base Styles ──► Variants ──► Sizes ──► Interactive States ──► Consumer Overrides (className)
```

1. **Base Styles**: Layout, display, typography defaults, border radius, and transitions.
2. **Variants**: Visual semantics (`default`, `secondary`, `outline`, `destructive`, `ghost`).
3. **Sizes**: Scale dimensions (`sm`, `md`, `lg`, `icon`) adjusting padding, height, and font sizes.
4. **States**: Focus rings (`focus-visible`), disabled states, hover, active, and data attributes.
5. **Consumer Overrides**: Merged cleanly using the `cn()` utility (`clsx` + `twMerge`).

---

## Tailwind v4 & Theming Architecture in MyLlama

In this project (`apps/web`), Tailwind CSS v4 is configured via `@tailwindcss/vite` and `@import "tailwindcss"` in `src/styles.css`.

- **CSS Variables as Single Source of Truth**: All theme colors (`--sea-ink`, `--sea-ink-soft`, `--lagoon`, `--palm`, `--line`, `--chip-bg`, etc.) are declared as CSS custom properties under `:root` and overridden under `:root[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`.
- **Runtime Theming**: Switching themes does not require re-rendering classes; updating `data-theme` or the `.dark` class immediately recalculates the variables.
- **Component Classes**: Prefer referencing semantic CSS variables (e.g. `text-[var(--sea-ink)]`, `border-[var(--line)]`, `bg-[var(--chip-bg)]`) or extending the `@theme` block in CSS.

---

## Key Implementation Patterns

### 1. Class Variance Authority (CVA) Components
Use CVA to create type-safe, variant-driven components:

```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-purple-600 text-white hover:bg-purple-700 focus-visible:ring-purple-500',
        secondary: 'bg-[var(--chip-bg)] border border-[var(--chip-line)] text-[var(--sea-ink)] hover:bg-[var(--island-bg)]',
        outline: 'border border-[var(--line)] bg-transparent hover:bg-[var(--chip-bg)] text-[var(--sea-ink)]',
        ghost: 'hover:bg-[var(--chip-bg)] text-[var(--sea-ink)]',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
)
Button.displayName = 'Button'
```

### 2. Compound Components
Structure complex UI cards, modal dialogs, and panels into composable pieces with a single mental model:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Encapsulate internal padding and typography so child parts snap together cleanly.

### 3. Accessible Form Inputs
- Always link `<label htmlFor="...">` with `<input id="...">`.
- Support `aria-invalid={!!error}` and `aria-describedby={errorId}`.
- Style focus rings with visible offset: `focus-visible:ring-2 focus-visible:ring-offset-2`.

---

## Utility Functions Standard

All Tailwind component class merging should use `cn()`:

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- `clsx` handles conditional class names (`{ 'opacity-50': disabled }`).
- `tailwind-merge` intelligently resolves conflicting utility classes (e.g., `p-4` overridden by `p-6`).

---

## Best Practices Checklist

### ✅ Do's
- **Use CSS Custom Properties**: Enable runtime theming without JavaScript re-renders.
- **Compose with CVA**: Keep variants type-safe and self-documenting.
- **Use Semantic Tokens**: Use `text-[var(--sea-ink-soft)]` or semantic tokens rather than hardcoded raw hex colors.
- **Support Keyboard Navigation**: Use `focus-visible:ring-2` on all clickable controls.
- **Forward Refs**: Always wrap primitives in `forwardRef` to allow slot composition, tooltips, and focus management.
- **Provide Visual Feedback**: Add hover transitions, active press effects (`active:scale-[0.98]`), and loading spinner states.

### ❌ Don'ts
- **No Arbitrary Hardcoded Colors**: Don't use `#173a40` inside JSX classes; use semantic tokens or theme variables.
- **No Direct Mutation of Globals**: Avoid deeply nested `@apply` chains in CSS; compose in React components.
- **Never Skip Disabled/Focus States**: Accessible components require both `disabled:` and `focus-visible:` states.
- **Don't Ignore Mobile Breakpoints**: Design mobile-first (`flex flex-col sm:flex-row`).

---

## Deep-Dive Playbook Reference

For the comprehensive implementation playbook with ready-to-use component templates (Buttons, Compound Cards, Forms, Grids, Animations, and Theme Providers), consult:
👉 **[playbook.md](./references/playbook.md)**
