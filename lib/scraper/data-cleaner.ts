export function cleanupMetadata(obj: Record<string, unknown> | unknown): void {
  if (typeof obj !== "object" || obj === null) return;

  const record = obj as Record<string, unknown>;
  Object.keys(record).forEach((key) => {
    if (
      record[key] === null ||
      record[key] === undefined ||
      record[key] === ""
    ) {
      delete record[key];
    } else if (typeof record[key] === "object" && !Array.isArray(record[key])) {
      cleanupMetadata(record[key]);
      if (
        typeof record[key] === "object" &&
        record[key] !== null &&
        Object.keys(record[key] as Record<string, unknown>).length === 0
      )
        delete record[key];
    } else if (Array.isArray(record[key])) {
      record[key] = (record[key] as unknown[]).filter(
        (item: unknown) => item !== null && item !== undefined && item !== ""
      );
      if ((record[key] as unknown[]).length === 0) delete record[key];
    }
  });
}
