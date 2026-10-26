type IconName = 'feed' | 'draft' | 'tiles' | 'login' | 'search' | 'heart' | 'next';

const paths: Record<IconName, string> = {
  feed: 'M3 11.2 12 3l9 8.2V21h-6v-6H9v6H3z',
  draft: 'M6 2h9l4 4v16H6z M14 2v5h5 M9 12h7 M9 16h5',
  tiles: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  login: 'M14 3h7v18h-7 M3 12h13 M11 7l5 5-5 5',
  search: 'M15 15l6 6 M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0',
  heart: 'M12 21S4 16.4 4 10.8A4.6 4.6 0 0 1 12 7.7a4.6 4.6 0 0 1 8 3.1C20 16.4 12 21 12 21Z',
  next: 'M5 12h14 M14 7l5 5-5 5',
};

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon icon--${name} ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
