import { useEffect, useState } from 'react';

// Выбранный файл остаётся в браузере. При замене и размонтировании URL освобождается.
export function useObjectUrl(file: File | null): string {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return preview?.file === file ? preview.url : '';
}
