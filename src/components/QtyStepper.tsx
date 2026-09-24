"use client";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
  ariaLabel?: string;
};

export function QtyStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className = "",
  ariaLabel = "Количество",
}: Props) {
  const safeMax = Math.max(min, max);
  const clamped = Math.min(safeMax, Math.max(min, value));

  function set(next: number) {
    const qty = Math.min(safeMax, Math.max(min, Math.floor(next) || min));
    onChange(qty);
  }

  return (
    <div className={`qty-stepper ${className}`.trim()} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="qty-stepper-btn"
        aria-label="Уменьшить"
        disabled={clamped <= min}
        onClick={() => set(clamped - 1)}
      >
        −
      </button>
      <input
        type="number"
        className="qty-stepper-input"
        min={min}
        max={safeMax}
        value={clamped}
        aria-label={ariaLabel}
        onChange={(e) => set(Number(e.target.value))}
      />
      <button
        type="button"
        className="qty-stepper-btn"
        aria-label="Увеличить"
        disabled={clamped >= safeMax}
        onClick={() => set(clamped + 1)}
      >
        +
      </button>
    </div>
  );
}
