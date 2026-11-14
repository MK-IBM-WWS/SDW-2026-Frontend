import { useEffect } from 'react';
import { MOCK_ONLY } from '../modules/environment';
import { Pagination } from '../components/Pagination';
import { PriceFilter } from '../components/PriceFilter';
import { TariffCard } from '../components/TariffCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTariffDispatch, useTariffSelector } from '../store';
import { getTariffs, setTariffPriceStep, applyTariffPriceFilter, setCurrentPage } from '../store/tariffsSlice';

export function TilesPage() {
  const dispatch = useTariffDispatch();
  const { items, selectedPriceStep, appliedPriceStep, listSource, listReady, currentPage, totalPages, total } = useTariffSelector((state) => state.tariffs);
  const authenticated = useTariffSelector((state) => state.tariffUser.isAuthenticated);
  const busy = useTariffSelector((state) => state.tariffInterface.pending > 0);
  const login = useTariffSelector((state) => state.tariffUser.login);
  usePageTitle('Тарифы облачного хостинга');
  useEffect(() => {
    if (!listReady) void dispatch(getTariffs());
  }, [dispatch, listReady, appliedPriceStep, authenticated, currentPage]);
  const applyFilter = () => {
    if (selectedPriceStep === appliedPriceStep) void dispatch(getTariffs());
    else dispatch(applyTariffPriceFilter());
  };
  return <div className="page page--pattern page--tariffs">
    <header className="page-header"><h1 className="page-header__title">Тарифы</h1>
      {authenticated && <small>{login}</small>}</header>
    <PriceFilter step={selectedPriceStep} onStepChange={(value) => dispatch(setTariffPriceStep(value))}
      onApply={applyFilter} disabled={busy} />
    {!MOCK_ONLY && listSource === 'mock' && <p className="tariff-offline" role="status">Сервер недоступен. Демонстрационные тарифы.</p>}
    <div className="tariff-stats" aria-live="polite">
      <span>Найдено: {total.toLocaleString('ru-RU')}</span>
    </div>
    <main className="tiles tiles--paginated" aria-label="Список тарифов">
      <p className="visually-hidden" role="status">Найдено тарифов: {total}</p>
      {items.map((tariff) => <TariffCard key={tariff.tariff_id} tariff={tariff} />)}
      {!busy && !items.length && <p className="empty-state">Тарифы не найдены.</p>}
    </main>
    <Pagination currentPage={currentPage} totalPages={totalPages} disabled={busy}
      onPageChange={(page) => dispatch(setCurrentPage(page))} />
  </div>;
}
