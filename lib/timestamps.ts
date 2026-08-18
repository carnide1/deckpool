/** Normalize Firestore Timestamp / epoch / { seconds } to millis. */
export function timestampToMillis(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "object") {
    const record = value as {
      toMillis?: () => number;
      seconds?: number;
    };
    if (typeof record.toMillis === "function") {
      const ms = record.toMillis();
      return Number.isFinite(ms) ? ms : 0;
    }
    if (typeof record.seconds === "number") {
      return record.seconds * 1000;
    }
  }
  return 0;
}
