"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { FocusTrap } from "@/components/FocusTrap";

export type ConfirmTone = "danger" | "default";
export type ToastTone = "success" | "error" | "info";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

export type ToastOptions = {
  message: string;
  tone?: ToastTone;
  duration?: number;
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type UiFeedbackContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  toast: (options: ToastOptions | string) => void;
};

const UiFeedbackContext = createContext<UiFeedbackContextValue | null>(null);

let toastSeq = 0;

export function useUiFeedback() {
  const ctx = useContext(UiFeedbackContext);
  if (!ctx) {
    throw new Error("useUiFeedback must be used within UiFeedbackProvider");
  }
  return ctx;
}

/** Safe hook when provider might be missing in isolated trees. */
export function useOptionalUiFeedback() {
  return useContext(UiFeedbackContext);
}

export function UiFeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    setMounted(true);
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!confirmState) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [confirmState]);

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions | string) => {
      const opts = typeof options === "string" ? { message: options } : options;
      const id = ++toastSeq;
      const tone = opts.tone ?? "info";
      const duration = opts.duration ?? (tone === "error" ? 5200 : 3800);
      setToasts((list) => [...list, { id, message: opts.message, tone }]);
      const timer = window.setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  function closeConfirm(result: boolean) {
    setConfirmState((current) => {
      current?.resolve(result);
      return null;
    });
  }

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);

  return (
    <UiFeedbackContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <>
              <div className="site-toast-stack" aria-live="polite" aria-relevant="additions">
                {toasts.map((item) => (
                  <div
                    key={item.id}
                    className={`site-toast site-toast--${item.tone}`}
                    role={item.tone === "error" ? "alert" : "status"}
                  >
                    <span className="site-toast-icon" aria-hidden>
                      {item.tone === "success" ? "✓" : item.tone === "error" ? "!" : "i"}
                    </span>
                    <p className="site-toast-message">{item.message}</p>
                    <button
                      type="button"
                      className="site-toast-close"
                      aria-label="Закрыть"
                      onClick={() => dismissToast(item.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {confirmState ? (
                <FocusTrap active onEscape={() => closeConfirm(false)}>
                  <div className="site-dialog-backdrop" role="presentation">
                    <div
                      className="site-dialog-scrim"
                      aria-hidden="true"
                      onClick={() => closeConfirm(false)}
                    />
                    <div
                      className={`site-dialog site-dialog--${confirmState.tone ?? "default"}`}
                      role="alertdialog"
                      aria-modal="true"
                      aria-labelledby="site-dialog-title"
                      aria-describedby="site-dialog-desc"
                    >
                      <span className="site-dialog-icon" aria-hidden>
                        !
                      </span>
                      <div className="site-dialog-body">
                        <h2 id="site-dialog-title" className="site-dialog-title">
                          {confirmState.title}
                        </h2>
                        <p id="site-dialog-desc" className="site-dialog-message">
                          {confirmState.message}
                        </p>
                        <div className="site-dialog-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => closeConfirm(false)}
                          >
                            {confirmState.cancelLabel ?? "Нет"}
                          </button>
                          <button
                            type="button"
                            className={`btn ${confirmState.tone === "danger" ? "btn-danger" : "btn-primary"}`}
                            onClick={() => closeConfirm(true)}
                          >
                            {confirmState.confirmLabel ?? "Да"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </FocusTrap>
              ) : null}
            </>,
            document.body,
          )
        : null}
    </UiFeedbackContext.Provider>
  );
}
