"use client";

import {
  useCallback,
  useRef,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { useUiFeedback } from "@/components/UiFeedback";

type FieldEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isField(el: Element): el is FieldEl {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readableLabel(field: FieldEl) {
  const wrap = field.closest("label");
  if (wrap) {
    const clone = wrap.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("input, select, textarea, .site-field-hint, a, span, strong, p").forEach((n) => {
      n.remove();
    });
    const text = clone.textContent?.replace(/\*/g, "").replace(/\s+/g, " ").trim();
    if (text) return text;
  }
  if (field.getAttribute("aria-label")) return field.getAttribute("aria-label")!;
  if (field.name === "consent") return "согласие на обработку персональных данных";
  if (field.name === "deliveryAddress") return "Адрес доставки";
  return "это поле";
}

export function siteValidationMessage(field: FieldEl) {
  if (field.validity.valueMissing) {
    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      return "Чтобы продолжить, установите этот флажок.";
    }
    if (field instanceof HTMLSelectElement) {
      return `Выберите: ${readableLabel(field)}.`;
    }
    return `Заполните поле «${readableLabel(field)}».`;
  }
  if (field.validity.typeMismatch) {
    if (field instanceof HTMLInputElement && field.type === "email") {
      return "Укажите корректный email.";
    }
    return "Проверьте формат значения.";
  }
  if (field.validity.tooShort) {
    const min =
      field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
        ? field.minLength
        : 0;
    return `Введите не меньше ${min} символов.`;
  }
  if (field.validity.tooLong) {
    const max =
      field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
        ? field.maxLength
        : 0;
    return `Слишком длинное значение (макс. ${max}).`;
  }
  if (field.validity.patternMismatch) {
    return "Проверьте формат значения.";
  }
  if (field.validity.rangeUnderflow || field.validity.rangeOverflow) {
    return "Значение вне допустимого диапазона.";
  }
  return field.validationMessage || "Проверьте это поле.";
}

function clearFieldError(field: FieldEl) {
  field.classList.remove("is-invalid");
  field.removeAttribute("aria-invalid");
  const consent = field.closest(".consent-field");
  consent?.classList.remove("is-invalid");

  const hosts = [consent, field.closest(".checkout-delivery-address"), field.closest("label"), field.parentElement];
  for (const host of hosts) {
    host?.querySelectorAll(".site-field-hint[data-site-error]").forEach((node) => node.remove());
  }
}

function clearFormErrors(form: HTMLFormElement) {
  form.querySelectorAll<FieldEl>("input.is-invalid, select.is-invalid, textarea.is-invalid").forEach(clearFieldError);
  form.querySelectorAll(".site-field-hint[data-site-error]").forEach((node) => node.remove());
  form.querySelectorAll(".consent-field.is-invalid").forEach((node) => node.classList.remove("is-invalid"));
}

function showFieldError(field: FieldEl, message: string) {
  clearFieldError(field);
  field.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");

  const hint = document.createElement("p");
  hint.className = "site-field-hint";
  hint.dataset.siteError = "true";
  hint.setAttribute("role", "alert");
  hint.innerHTML = `<span class="site-field-hint-icon" aria-hidden="true">!</span><span>${escapeHtml(message)}</span>`;

  const consent = field.closest(".consent-field");
  if (consent) {
    consent.classList.add("is-invalid");
    consent.appendChild(hint);
    return;
  }

  const delivery = field.closest(".checkout-delivery-address");
  if (delivery) {
    const label = delivery.querySelector("label");
    if (label) {
      label.insertAdjacentElement("afterend", hint);
      return;
    }
  }

  const label = field.closest("label");
  if (label) {
    label.appendChild(hint);
    return;
  }

  field.insertAdjacentElement("afterend", hint);
}

export function validateSiteForm(form: HTMLFormElement): { ok: true } | { ok: false; message: string; field: FieldEl } {
  clearFormErrors(form);
  const fields = [...form.elements].filter(isField);
  let first: { message: string; field: FieldEl } | null = null;

  for (const field of fields) {
    if (field.disabled) continue;
    if (field.type === "submit" || field.type === "button" || field.type === "hidden") continue;
    if (!field.willValidate) continue;
    if (field.checkValidity()) continue;

    const message = siteValidationMessage(field);
    showFieldError(field, message);
    if (!first) first = { message, field };
  }

  if (first) return { ok: false, ...first };
  return { ok: true };
}

type SiteFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "noValidate"> & {
  children: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function SiteForm({ children, onSubmit, onInput, className, ...rest }: SiteFormProps) {
  const { toast } = useUiFeedback();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget;
      const result = validateSiteForm(form);
      if (!result.ok) {
        event.preventDefault();
        event.stopPropagation();
        toast({ message: result.message, tone: "error" });
        result.field.focus({ preventScroll: true });
        result.field.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      await onSubmit?.(event);
    },
    [onSubmit, toast],
  );

  return (
    <form
      {...rest}
      ref={formRef}
      noValidate
      className={className}
      onSubmit={(e) => void handleSubmit(e)}
      onInput={(e) => {
        const target = e.target;
        if (target instanceof Element && isField(target) && target.classList.contains("is-invalid")) {
          if (target.checkValidity()) clearFieldError(target);
        }
        onInput?.(e);
      }}
      onChange={(e) => {
        const target = e.target;
        if (target instanceof Element && isField(target) && target.classList.contains("is-invalid")) {
          if (target.checkValidity()) clearFieldError(target);
        }
      }}
    >
      {children}
    </form>
  );
}
