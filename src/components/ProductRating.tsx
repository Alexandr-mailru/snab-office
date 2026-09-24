type Props = {
  avg: number;
  count: number;
  compact?: boolean;
};

export function ProductRating({ avg, count, compact }: Props) {
  if (count <= 0) {
    return compact ? (
      <p className="rating-line rating-line-compact rating-line-placeholder" aria-hidden>
        ★ 0.0
      </p>
    ) : (
      <p className="rating-line muted">Пока нет отзывов</p>
    );
  }
  const label = `${count} отзыв${count % 10 === 1 && count % 100 !== 11 ? "" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20) ? "а" : "ов"}`;
  return (
    <p className={`rating-line ${compact ? "rating-line-compact" : ""}`}>
      ★ {avg.toFixed(1)} · {label}
    </p>
  );
}
