import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { Link, useSearchParams } from 'react-router-dom';
import type { Tariff } from '../types/tariff';
import { Icon } from '../components/Icon';
import { TariffVideo } from '../components/TariffVideo';
import { formatNumber } from '../modules/priceFilter';
import { usePageTitle } from '../hooks/usePageTitle';

function FeedCard({ tariff, nextId }: { tariff: Tariff; nextId?: number }) {
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
          <Button className="feed__like-button" disabled aria-label="Лайки доступны после входа" title="Лайки доступны после входа"><Icon name="heart" /></Button>
          <strong>{tariff.like_count}</strong>
        </div>
        {nextId !== undefined && <Link className="feed__next" to={`/tariffs/feed?id=${nextId}`} aria-label="Следующий тариф"><Icon name="next" /></Link>}
      </aside>
    </main>
  );
}

export function FeedPage({ tariffs }: { tariffs: readonly Tariff[] }) {
  const [params] = useSearchParams();
  const id = params.get('id');
  const index = id === null ? 0 : tariffs.findIndex((tariff) => String(tariff.tariff_id) === id);
  const tariff = tariffs[index];

  if (!tariff) {
    return <main className="message-page"><h1>Тариф не найден</h1><Link to="/tariffs">Вернуться к плитке</Link></main>;
  }
  const nextId = tariffs.length > 1 ? tariffs[(index + 1) % tariffs.length].tariff_id : undefined;
  // key сбрасывает раскрытое описание и состояние видео при смене карточки.
  return <FeedCard key={tariff.tariff_id} tariff={tariff} nextId={nextId} />;
}
