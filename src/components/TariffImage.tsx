import Card from 'react-bootstrap/Card';
import { useState } from 'react';

import { publicAsset } from '../modules/environment';
export const DEFAULT_IMAGE = publicAsset('media/example.jpg');

export function TariffImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageSrc = !src.trim() || failedSource === src ? DEFAULT_IMAGE : src;

  return <Card.Img className={className} src={imageSrc} alt={alt} onError={() => {
    // Ошибка стандартной картинки не вызывает бесконечную повторную загрузку.
    if (imageSrc !== DEFAULT_IMAGE) setFailedSource(src);
  }} />;
}
