import { useState } from 'react';
import { DEFAULT_IMAGE } from './TariffImage';

const DEFAULT_VIDEO = '/media/example.mp4';

interface Props {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
}

export function TariffVideo({ src, poster, className = '', controls = false, autoPlay = false }: Props) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const videoSrc = !src.trim() || failedSource === src ? DEFAULT_VIDEO : src;

  if (fallbackFailed) {
    return <p className="media-error" role="status">Не удалось воспроизвести видео.</p>;
  }

  return <video key={videoSrc} className={className} src={videoSrc} poster={poster || DEFAULT_IMAGE}
    autoPlay={autoPlay} muted loop playsInline controls={controls} preload="metadata"
    onError={() => {
      if (videoSrc !== DEFAULT_VIDEO) setFailedSource(src);
      else setFallbackFailed(true);
    }} />;
}
