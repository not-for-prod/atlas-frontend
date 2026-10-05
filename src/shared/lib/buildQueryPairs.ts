export const buildQueryPairs = <T extends object>(query?: T): Array<[string, string]> => {
  const stack: Array<{ prefix: string; value: unknown }> = [];
  const result: Array<[string, string]> = [];

  // Изначально кидаем все верхнеуровневые пары в стек
  for (const [key, value] of Object.entries(query ?? {})) {
    stack.push({ prefix: key, value });
  }

  while (stack.length > 0) {
    const { prefix, value } = stack.pop()!;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      // Примитив — конечный
      result.push([prefix, String(value)]);
      continue;
    }

    if (Array.isArray(value)) {
      // Массив: повторяем ключ
      for (const v of value) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          result.push([prefix, String(v)]);
        } else {
          // Если массив внезапно вложенный, обрабатываем
          stack.push({ prefix, value: v });
        }
      }

      continue;
    }

    if (value && typeof value === 'object') {
      // Объект: ключи разворачиваем
      for (const [k, v] of Object.entries(value)) {
        stack.push({ prefix: `${prefix}.${k}`, value: v });
      }
    }

    // null/undefined/прочий мусор игнорируем
  }

  return result;
};
