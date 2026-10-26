import { useState } from 'react';
import type { FormEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { usePageTitle } from '../hooks/usePageTitle';
import { TariffImage } from '../components/TariffImage';
import { TariffVideo } from '../components/TariffVideo';

// Заготовка третьей страницы. Navbar на неё не ведёт; данные никуда не отправляются.
export function DraftPage() {
  const [detailsStep, setDetailsStep] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [ram, setRam] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const imageUrl = useObjectUrl(image);
  const videoUrl = useObjectUrl(video);
  usePageTitle('Черновик тарифа');

  const next = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setDetailsStep(true);
  };

  return (
    <div className="page page--pattern">
      <header className="page-header page-header--draft">
        <h1 className="page-header__title">Тариф</h1><span className="draft-status">{detailsStep ? 'черновик' : 'новый'}</span>
      </header>
      <main className="draft">
        <Form onSubmit={next}>
          <div className="draft__media-stack">
            <Form.Group controlId="image-file" className="media-field">
              <Form.Label className="draft__label">Фото</Form.Label>
              <div className="media-field__preview">
                <TariffImage key={imageUrl} src={imageUrl} alt="Фото черновика" />
                {!detailsStep && <Form.Control className="draft__file" type="file" accept="image/*" required
                  onChange={(event) => setImage((event.target as HTMLInputElement).files?.[0] ?? null)} />}
              </div>
            </Form.Group>
            <Form.Group controlId="video-file" className="media-field">
              <Form.Label className="draft__label">Видео</Form.Label>
              <div className="media-field__preview">
                <TariffVideo key={videoUrl} src={videoUrl} autoPlay />
                {!detailsStep && <Form.Control className="draft__file" type="file" accept="video/*" required
                  onChange={(event) => setVideo((event.target as HTMLInputElement).files?.[0] ?? null)} />}
              </div>
            </Form.Group>
          </div>
          <Form.Group controlId="draft-name">
            <Form.Label className="draft__label">Название</Form.Label>
            <Form.Control className="draft__input" type="text" required maxLength={100} value={name}
              placeholder="Например, Selectel Start" onChange={(event) => setName(event.target.value)} />
          </Form.Group>
          {detailsStep && <>
            <Form.Group controlId="draft-description">
              <Form.Label className="draft__label">Краткое описание</Form.Label>
              <Form.Control as="textarea" className="draft__input draft__input--area" rows={3} required maxLength={500}
                value={description} onChange={(event) => setDescription(event.target.value)} />
            </Form.Group>
            <div className="draft__two-columns">
              <Form.Group controlId="draft-price">
                <Form.Label className="draft__label">Цена, ₽ / месяц</Form.Label>
                <Form.Control className="draft__input" type="number" min={0} step={1} required value={price} onChange={(event) => setPrice(event.target.value)} />
              </Form.Group>
              <Form.Group controlId="draft-ram">
                <Form.Label className="draft__label">RAM, ГБ</Form.Label>
                <Form.Control className="draft__input" type="number" min={1} step={1} required value={ram} onChange={(event) => setRam(event.target.value)} />
              </Form.Group>
            </div>
          </>}
          <Button className="draft__submit" type={detailsStep ? 'button' : 'submit'} disabled={detailsStep}>
            {detailsStep ? 'Опубликовать' : 'Далее'}
          </Button>
        </Form>
      </main>
    </div>
  );
}
