import { Pagination as BootstrapPagination } from 'react-bootstrap';

interface Props {
  currentPage: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

// В БД тысячи страниц: отображаем только соседние номера, а не все кнопки сразу.
export function Pagination({ currentPage, totalPages, disabled, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  const first = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
  const last = Math.min(totalPages, first + 2);
  const pages = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const select = (page: number) => { if (!disabled && page !== currentPage) onPageChange(page); };
  return <nav aria-label="Страницы тарифов" className="tariff-pagination">
    <BootstrapPagination size="sm">
      <BootstrapPagination.First disabled={disabled || currentPage === 1} onClick={() => select(1)} aria-label="Первая страница" />
      <BootstrapPagination.Prev disabled={disabled || currentPage === 1} onClick={() => select(currentPage - 1)} aria-label="Предыдущая страница" />
      {first > 1 && <BootstrapPagination.Ellipsis disabled />}
      {pages.map((page) => <BootstrapPagination.Item key={page} active={page === currentPage}
        disabled={disabled} onClick={() => select(page)}>{page}</BootstrapPagination.Item>)}
      {last < totalPages && <BootstrapPagination.Ellipsis disabled />}
      <BootstrapPagination.Next disabled={disabled || currentPage === totalPages} onClick={() => select(currentPage + 1)} aria-label="Следующая страница" />
      <BootstrapPagination.Last disabled={disabled || currentPage === totalPages} onClick={() => select(totalPages)} aria-label="Последняя страница" />
    </BootstrapPagination>
  </nav>;
}
