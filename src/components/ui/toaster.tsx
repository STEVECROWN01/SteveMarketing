"use client";

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
/* VOLET 20 (26/11/2026) — ICÔNE SYSTÉMATIQUE : chaque toast porte
 * une icône, même quand l'appelant n'en fournit pas (demande de
 * l'éditeur : « tous les toasts notification doivent avoir d'icon
 * dessus (verte ou rouge selon le message ou l'action éffectuée) »).
 * Vert + coche pour un toast de succès/neutralité (variant
 * « default »), rouge + triangle pour un toast « destructive ». */
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, icon, variant, ...props }) {
        const icone =
          icon ?? (
            <span className="mt-0.5 shrink-0 leading-none">
              {variant === "destructive" ? (
                <AlertCircle className="h-5 w-5 text-[#ea384c]" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-[#22c55e]" aria-hidden="true" />
              )}
            </span>
          )
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {icone}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
