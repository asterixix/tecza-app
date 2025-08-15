"use client";
import { toast as baseToast } from "sonner";

type ToastVariant = "default" | "destructive" | "success" | "info" | "warning";

type ToastInput =
  | string
  | {
      title?: string;
      description?: string;
      variant?: ToastVariant;
    };

function appToast(input: ToastInput) {
  if (typeof input === "string") {
    baseToast(input);
    return;
  }

  const { title, description, variant = "default" } = input;
  const msg = title ?? description ?? "";

  switch (variant) {
    case "destructive":
      baseToast.error(msg || "Błąd", { description });
      break;
    case "success":
      baseToast.success(msg || "Sukces", { description });
      break;
    case "info": {
      // Some versions expose info; fallback to default toast
      const bt = baseToast as unknown as Record<string, (m: string, o?: { description?: string }) => void>;
      const infoFn = bt["info"] ?? baseToast;
      infoFn(msg || "Info", { description });
      break;
    }
    case "warning": {
      // Some versions expose warning; fallback to default toast
      const bt = baseToast as unknown as Record<string, (m: string, o?: { description?: string }) => void>;
      const warnFn = bt["warning"] ?? baseToast;
      warnFn(msg || "Uwaga", { description });
      break;
    }
    default:
      baseToast(msg, { description });
  }
}

export function useToast() {
  return { toast: appToast };
}
