/**
 * Card UI Components
 * 
 * A collection of card-related components built on Radix UI patterns.
 * Provides a flexible foundation for creating content containers with
 * consistent styling and semantic structure.
 * 
 * Components included:
 * - Card: Main container with border and shadow
 * - CardHeader: Top section for titles and descriptions
 * - CardTitle: Primary heading within the card
 * - CardDescription: Subtitle or description text
 * - CardContent: Main content area
 * - CardFooter: Bottom section for actions
 * 
 * Features:
 * - Semantic HTML structure for accessibility
 * - Design system token integration
 * - Flexible styling with className override support
 * - Proper ref forwarding for composition
 * 
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Dashboard Statistics</CardTitle>
 *     <CardDescription>Overview of key metrics</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     Content goes here...
 *   </CardContent>
 *   <CardFooter>
 *     <Button>View Details</Button>
 *   </CardFooter>
 * </Card>
 * 
 * @author Educational Platform Team
 * @version 1.0.0
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Main Card Container Component
 * 
 * The foundational card component that provides the basic container
 * with rounded corners, border, background, and shadow styling.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * Card Header Component
 * 
 * Container for card title and description elements.
 * Provides consistent spacing and layout for the card's top section.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * Card Title Component
 * 
 * The main heading element within a card header.
 * Renders as h3 with large, semibold text styling.
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * Card Description Component
 * 
 * Secondary text element for providing additional context.
 * Uses muted foreground color for visual hierarchy.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * Card Content Component
 * 
 * Main content area of the card with consistent padding.
 * Excludes top padding to work well with CardHeader.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * Card Footer Component
 * 
 * Bottom section of the card, typically used for actions.
 * Includes flex layout for button alignment.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
