'use client'

import { type ComponentProps } from 'react'
import {
  Action as AlertDialogActionPrimitive,
  Cancel as AlertDialogCancelPrimitive,
  Content as AlertDialogContentPrimitive,
  Description as AlertDialogDescriptionPrimitive,
  Overlay as AlertDialogOverlayPrimitive,
  Portal as AlertDialogPortalPrimitive,
  Root as AlertDialogRoot,
  Title as AlertDialogTitlePrimitive,
  Trigger as AlertDialogTriggerPrimitive,
} from '@radix-ui/react-alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function AlertDialog({ ...props }: ComponentProps<typeof AlertDialogRoot>) {
  return <AlertDialogRoot data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({
  ...props
}: ComponentProps<typeof AlertDialogTriggerPrimitive>) {
  return (
    <AlertDialogTriggerPrimitive data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: ComponentProps<typeof AlertDialogPortalPrimitive>) {
  return (
    <AlertDialogPortalPrimitive data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: ComponentProps<typeof AlertDialogOverlayPrimitive>) {
  return (
    <AlertDialogOverlayPrimitive
      data-slot="alert-dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialogContentPrimitive>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogContentPrimitive
        data-slot="alert-dialog-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-right', className)}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof AlertDialogTitlePrimitive>) {
  return (
    <AlertDialogTitlePrimitive
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDialogDescriptionPrimitive>) {
  return (
    <AlertDialogDescriptionPrimitive
      data-slot="alert-dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: ComponentProps<typeof AlertDialogActionPrimitive>) {
  return (
    <AlertDialogActionPrimitive
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: ComponentProps<typeof AlertDialogCancelPrimitive>) {
  return (
    <AlertDialogCancelPrimitive
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
