export function cleanObject(obj: Record<string, unknown> | unknown): void {
  if (typeof obj !== 'object' || obj === null) return;

  const record = obj as Record<string, unknown>;
  Object.keys(record).forEach((key) => {
    const value = record[key];

    // Remove null, undefined, or empty string values
    const isEmptyValue = value === null || value === undefined || value === '';
    if (isEmptyValue) {
      delete record[key];
      return;
    }

    // Handle nested objects
    const isObject = typeof value === 'object' && !Array.isArray(value);
    if (isObject) {
      cleanObject(value);

      // Remove empty objects after cleaning
      const isEmptyObject = typeof value === 'object' && value !== null && Object.keys(value as Record<string, unknown>).length === 0;

      if (isEmptyObject) {
        delete record[key];
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      const cleanedArray = value.filter((item: unknown) => item !== null && item !== undefined && item !== '');

      if (cleanedArray.length === 0) {
        delete record[key];
      } else {
        record[key] = cleanedArray;
      }
    }
  });
}
