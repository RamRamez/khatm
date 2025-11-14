'use client'

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from 'react'
import {
  Indicator as RadioGroupIndicator,
  Item as RadioGroupItemPrimitive,
  Root as RadioGroupRoot,
} from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const RadioGroup = forwardRef<
  ComponentRef<typeof RadioGroupRoot>,
  ComponentPropsWithoutRef<typeof RadioGroupRoot>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupRoot
      className={cn('grid gap-2', className)}
      {...props}
      ref={ref}
      dir="rtl"
    />
  )
})
RadioGroup.displayName = RadioGroupRoot.displayName

const RadioGroupItem = forwardRef<
  ComponentRef<typeof RadioGroupItemPrimitive>,
  ComponentPropsWithoutRef<typeof RadioGroupItemPrimitive>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupItemPrimitive
      ref={ref}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <RadioGroupIndicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupIndicator>
    </RadioGroupItemPrimitive>
  )
})
RadioGroupItem.displayName = RadioGroupItemPrimitive.displayName

export { RadioGroup, RadioGroupItem }
