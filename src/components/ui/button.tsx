/**
 * Button Component
 * 
 * A flexible, accessible button component built on Radix UI primitives.
 * Supports multiple variants, sizes, and can be rendered as different elements
 * using the asChild prop for composition patterns.
 * 
 * Features:
 * - Multiple visual variants (default, destructive, outline, secondary, ghost, link)
 * - Size variations (sm, default, lg, icon)
 * - Accessibility features with proper focus management
 * - Composition support via Radix Slot
 * - Consistent styling with design system tokens
 * 
 * @example
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * // With variant and size
 * <Button variant="outline" size="lg">Large outline button</Button>
 * 
 * // As a link using asChild
 * <Button asChild>
 *   <Link to="/dashboard">Dashboard</Link>
 * </Button>
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button Variants Configuration using CVA (Class Variance Authority)
 * 
 * Defines all available button styles and sizes using design system tokens.
 * Each variant uses semantic color tokens for consistent theming.
 */
const buttonVariants = cva(
  // Base styles applied to all button variants
  // Includes flex layout, accessibility features, transitions, and icon handling
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary button using main brand colors
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Destructive actions (delete, remove) using warning colors
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Secondary button with border and background on hover
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        // Subtle button using secondary colors
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Minimal button with hover background only
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Link-styled button with underline
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Standard button size for most use cases
        default: "h-10 px-4 py-2",
        // Smaller button for compact interfaces
        sm: "h-9 rounded-md px-3",
        // Larger button for important actions
        lg: "h-11 rounded-md px-8",
        // Square button for icons only
        icon: "h-10 w-10",
      },
    },
    // Default values when no variant or size is specified
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button Props Interface
 * 
 * Extends native button attributes with custom variant props and composition support.
 * The asChild prop enables rendering as different elements while maintaining styling.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Enable composition - render as child element instead of button */
  asChild?: boolean
}

/**
 * Button Component Implementation
 * 
 * Uses React.forwardRef to properly forward refs for composition patterns.
 * Conditionally renders as Slot (for composition) or native button element.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Use Slot for composition or native button element
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
// Set display name for better debugging experience
Button.displayName = "Button"

export { Button, buttonVariants }
