"use client";

type Props = {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
};

export function PriceRangeSlider({ min, max, valueMin, valueMax, onChange }: Props) {
  const safeMin = Math.min(valueMin, valueMax);
  const safeMax = Math.max(valueMin, valueMax);

  return (
    <div className="price-range">
      <div className="price-range-values">
        <span>{safeMin.toLocaleString("ru-RU")} ₽</span>
        <span>{safeMax.toLocaleString("ru-RU")} ₽</span>
      </div>
      <div className="price-range-inputs">
        <input
          type="range"
          min={min}
          max={max}
          value={safeMin}
          onChange={(e) => onChange(Number(e.target.value), safeMax)}
          aria-label="Минимальная цена"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={safeMax}
          onChange={(e) => onChange(safeMin, Number(e.target.value))}
          aria-label="Максимальная цена"
        />
      </div>
    </div>
  );
}
