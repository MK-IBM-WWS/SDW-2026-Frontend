import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { Link, useSearchParams } from 'react-router-dom';
import type { Tariff } from '../types/tariff';
import { Icon } from '../components/Icon';
import { TariffVideo } from '../components/TariffVideo';
import { formatNumber } from '../modules/priceFilter';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTariffDispatch, useTariffSelector } from '../store';
import { getTariffFeed, setTariffLike } from '../store/tariffsSlice';

function FeedCard({ tariff, onNext }: { tariff: Tariff; onNext: () => void }) {
  const dispatch = useTariffDispatch();
  const authenticated = useTariffSelector((state) => state.tariffUser.isAuthenticated);
  const busy = useTariffSelector((state) => state.tariffInterface.pending > 0);
  const [expanded, setExpanded] = useState(false);
  usePageTitle(tariff.tariff_name);
  const words = tariff.short_description.split(' ');
  const preview = words.slice(0, 3).join(' ');

  return (
    <main className="feed" aria-label="Лента тарифов">
      <TariffVideo key={tariff.tariff_id} className="feed__video" src={tariff.video_url} poster={tariff.image_url} autoPlay />
      <div className="feed__overlay" aria-hidden="true" />
      <section className="feed__content">
        <h1 className="feed__title">{tariff.tariff_name}</h1>
        <div className="feed__description">
          <p id="tariff-description">{expanded ? tariff.short_description : preview}</p>
          {words.length > 3 && <Button variant="link" className="feed__more" aria-expanded={expanded} aria-controls="tariff-description"
            onClick={() => setExpanded(!expanded)}>{expanded ? 'свернуть' : 'ещё…'}</Button>}
        </div>
        <p className="feed__price">{formatNumber(tariff.price_per_month)} ₽ / месяц</p>
      </section>
      <aside className="feed__actions" aria-label="Параметры тарифа">
        <div className="feed__ram" aria-label={`Оперативная память: ${tariff.ram_gb} ГБ`}>
          <span className="feed__ram-icon-frame" aria-hidden="true"><img className="feed__ram-icon" src="/images/ram.png" alt="" /></span>
          <strong className="feed__ram-value">{tariff.ram_gb} ГБ</strong>
        </div>
        <div className="feed__likes" aria-label={`Лайков: ${tariff.like_count}`}>
          <Button className="feed__like-button" disabled={!authenticated || busy} aria-pressed={tariff.is_liked === 1}
            aria-label={tariff.is_liked === 1 ? 'Отменить лайк' : 'Поставить лайк'}
            title={authenticated ? 'Лайк' : 'Сначала войдите'}
            onClick={() => dispatch(setTariffLike({ id: tariff.tariff_id, value: tariff.is_liked === 1 ? 0 : 1 }))}><Icon name="heart" /></Button>
          <strong>{tariff.like_count}</strong>
        </div>
        <Button className="feed__next" disabled={busy} onClick={onNext} aria-label="Следующий тариф"><Icon name="next" /></Button>
      </aside>
    </main>
  );
}

export function FeedPage() {
  const dispatch = useTariffDispatch();
  const [params, setParams] = useSearchParams();
  const positionParam = params.get('position');
  const position = positionParam === null ? undefined : Number(positionParam);
  const idParam = params.get('id');
  const next = params.get('next') === 'true';
  const id = idParam === null ? undefined : Number(idParam);
  const { feed, feedRequest, feedSource, feedMeta, feedReady } = useTariffSelector((state) => state.tariffs);
  const authenticated = useTariffSelector((state) => state.tariffUser.isAuthenticated);
  usePageTitle('Лента тарифов');
  useEffect(() => {
    if (feedReady && (id !== undefined || position !== undefined))
      void dispatch(getTariffFeed({ ...(position !== undefined ? { position } : { id, ...(next ? { next: true } : {}) }) }));
  }, [dispatch, id, position, next, authenticated, feedReady]);
  if (!feed) return <main className="message-page"><h1>{feedRequest ? 'Загрузка…' : 'Тариф не найден'}</h1>
    <Link to="/tariffs">Вернуться к плитке</Link></main>;
  return <>
    {feedSource === 'mock' && <p className="tariff-offline tariff-offline--feed">Демонстрационные тарифы</p>}
    <FeedCard key={feed.tariff_id} tariff={feed}
      onNext={() => setParams(feedMeta?.position ? { position: String(feedMeta.position + 1) } : { id: String(feed.tariff_id), next: 'true' })} />
  </>;
}
