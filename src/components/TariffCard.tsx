import Card from 'react-bootstrap/Card';
import { Link } from 'react-router-dom';
import type { Tariff } from '../types/tariff';
import { formatNumber } from '../modules/priceFilter';
import { Icon } from './Icon';
import { TariffImage } from './TariffImage';

export function TariffCard({ tariff }: { tariff: Tariff }) {
  return (
    <Card as="article" className="tile">
      <Link className="tile__link" to={`/tariffs/feed?id=${tariff.tariff_id}`} aria-label={`Открыть тариф ${tariff.tariff_name}`}>
        <TariffImage className="tile__image" src={tariff.image_url} alt={tariff.tariff_name} />
        <Card.Body className="tile__body">
          <Card.Title as="h2" className="tile__name" title={tariff.tariff_name}>{tariff.tariff_name}</Card.Title>
          <Card.Text className="tile__price">{formatNumber(tariff.price_per_month)} ₽ / месяц</Card.Text>
          <span className="tile__likes" aria-label={`Лайков: ${tariff.like_count}`}><Icon name="heart" />{tariff.like_count}</span>
          <span className="tile__open" aria-hidden="true">›</span>
        </Card.Body>
      </Link>
    </Card>
  );
}
