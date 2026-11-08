import { useEffect } from 'react';
import { PriceFilter } from '../components/PriceFilter';
import { TariffCard } from '../components/TariffCard';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTariffDispatch, useTariffSelector } from '../store';
import { getTariffs, setTariffPriceStep, applyTariffPriceFilter } from '../store/tariffsSlice';

export function TilesPage() {
  const dispatch = useTariffDispatch();
  const { items, selectedPriceStep, appliedPriceStep, listSource, listReady } = useTariffSelector((state) => state.tariffs);
  const authenticated = useTariffSelector((state) => state.tariffUser.isAuthenticated);
  const busy = useTariffSelector((state) => state.tariffInterface.pending > 0);
  const login = useTariffSelector((state) => state.tariffUser.login);
  usePageTitle('Тарифы облачного хостинга');
  useEffect(() => {
    if (!listReady) void dispatch(getTariffs());
  }, [dispatch, listReady, appliedPriceStep, authenticated]);
  const applyFilter = () => {
    if (selectedPriceStep === appliedPriceStep) void dispatch(getTariffs());
    else dispatch(applyTariffPriceFilter());
  };
  return <div className="page page--pattern">
    <header className="page-header"><h1 className="page-header__title">Тарифы</h1>
      {authenticated && <small>{login}</small>}</header>
    <PriceFilter step={selectedPriceStep} onStepChange={(value) => dispatch(setTariffPriceStep(value))}
      onApply={applyFilter} disabled={busy} />
    {listSource === 'mock' && <p className="tariff-offline" role="status">Сервер недоступен. Демонстрационные тарифы.</p>}
    <main className="tiles" aria-label="Список тарифов">
      <p className="visually-hidden" role="status">Найдено тарифов: {items.length}</p>
      {items.map((tariff) => <TariffCard key={tariff.tariff_id} tariff={tariff} />)}
      {!busy && !items.length && <p className="empty-state">Тарифы не найдены.</p>}
    </main>
  </div>;
}
