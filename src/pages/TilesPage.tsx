import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Tariff } from '../types/tariff';
import { getPriceStep, PRICE_STEPS } from '../modules/priceFilter';
import { PriceFilter } from '../components/PriceFilter';
import { TariffCard } from '../components/TariffCard';
import { usePageTitle } from '../hooks/usePageTitle';

export function TilesPage({ tariffs }: { tariffs: readonly Tariff[] }) {
  const [params, setParams] = useSearchParams();
  const appliedStep = getPriceStep(params.get('priceLimit'));
  const [selectedStep, setSelectedStep] = useState(appliedStep);
  const limit = PRICE_STEPS[appliedStep].value;
  const visibleTariffs = tariffs.filter((tariff) => limit === '' || tariff.price_per_month <= Number(limit));
  usePageTitle('Тарифы облачного хостинга');

  // Кнопки браузера «Назад/Вперёд» восстанавливают и слайдер, и список.
  useEffect(() => { setSelectedStep(appliedStep); }, [appliedStep]);

  const applyFilter = () => {
    const value = PRICE_STEPS[selectedStep].value;
    setParams(value ? { priceLimit: value } : {});
  };

  return (
    <div className="page page--pattern">
      <header className="page-header"><h1 className="page-header__title">Тарифы</h1></header>
      <PriceFilter step={selectedStep} onStepChange={setSelectedStep} onApply={applyFilter} />
      <main className="tiles" aria-label="Список тарифов">
        <p className="visually-hidden" role="status">Найдено тарифов: {visibleTariffs.length}</p>
        {visibleTariffs.map((tariff) => <TariffCard key={tariff.tariff_id} tariff={tariff} />)}
        {!visibleTariffs.length && <p className="empty-state">По выбранной цене тарифы не найдены.</p>}
      </main>
    </div>
  );
}
