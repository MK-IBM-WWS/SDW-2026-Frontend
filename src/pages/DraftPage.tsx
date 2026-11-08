import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormEvent } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { usePageTitle } from '../hooks/usePageTitle';
import { TariffImage } from '../components/TariffImage';
import { TariffVideo } from '../components/TariffVideo';

import type { Tariff } from '../types/tariff';
import { useTariffDispatch, useTariffSelector } from '../store';
import { createTariff, publishTariff, getTariffDraft, deleteTariff } from '../store/tariffsSlice';
import { tariffInterfaceError } from '../store/interfaceSlice';

export function DraftPage() {
  const dispatch = useTariffDispatch();
  const { draft, draftReady } = useTariffSelector((state) => state.tariffs);
  useEffect(() => { void dispatch(getTariffDraft()); }, [dispatch]);
  if (!draftReady) return <main className="message-page"><h1>Черновик тарифа</h1>
    <Button onClick={() => dispatch(getTariffDraft())}>Загрузить черновик</Button></main>;
  return <TariffDraftForm key={draft?.tariff_id ?? 'new'} draft={draft} />;
}

function TariffDraftForm({ draft }: { draft: Tariff | null }) {
  const detailsStep = draft !== null;
  const dispatch = useTariffDispatch();
  const navigate = useNavigate();
  const busy = useTariffSelector((state) => state.tariffInterface.pending > 0);
  const [name, setName] = useState(draft?.tariff_name ?? '');
  const [description, setDescription] = useState(draft?.short_description ?? '');
  const [price, setPrice] = useState(draft ? String(draft.price_per_month) : '');
  const [ram, setRam] = useState(draft?.ram_gb ? String(draft.ram_gb) : '');
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const imageUrl = useObjectUrl(image);
  const videoUrl = useObjectUrl(video);
  usePageTitle('Черновик тарифа');

  const next = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !name.trim()) return;
    if ((image && image.size > 10 * 1024 ** 2) || (video && video.size > 50 * 1024 ** 2)) {
      dispatch(tariffInterfaceError('Фото — до 10 МБ, видео — до 50 МБ')); return;
    }
    try {
      if (draft) {
        const tariff = await dispatch(publishTariff({ id: draft.tariff_id, tariff_name: name.trim(),
          short_description: description.trim(), price_per_month: Number(price), ram_gb: Number(ram),
          ...(image ? { image } : {}), ...(video ? { video } : {}) })).unwrap();
        navigate(`/tariffs/feed?id=${tariff.tariff_id}`);
      } else {
        await dispatch(createTariff({ tariff_name: name.trim(), ...(image ? { image } : {}), ...(video ? { video } : {}) })).unwrap();
      }
    } catch { /* Ошибку thunk уже сохранил в tariffInterface. */ }
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
                <button type="button" className="media-field__picker" aria-label="Изменить фото"
                  disabled={busy} onClick={() => imageInput.current?.click()}>
                  <TariffImage key={imageUrl || draft?.image_url} src={imageUrl || draft?.image_url || ''} alt="Фото черновика" />
                </button>
                <input ref={imageInput} id="image-file" className="draft__file" type="file" aria-label="Выбрать фото"
                  accept="image/jpeg,image/png,image/gif,image/webp" disabled={busy}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) setImage(file);
                    event.currentTarget.value = '';
                  }} />
              </div>
            </Form.Group>
            <Form.Group controlId="video-file" className="media-field">
              <Form.Label className="draft__label">Видео</Form.Label>
              <div className="media-field__preview">
                <button type="button" className="media-field__picker" aria-label="Изменить видео"
                  disabled={busy} onClick={() => videoInput.current?.click()}>
                  <TariffVideo key={videoUrl || draft?.video_url} src={videoUrl || draft?.video_url || ''} autoPlay />
                </button>
                <input ref={videoInput} id="video-file" className="draft__file" type="file" aria-label="Выбрать видео"
                  accept="video/mp4,video/webm" disabled={busy}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    if (file) setVideo(file);
                    event.currentTarget.value = '';
                  }} />
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
                <Form.Control className="draft__input" type="number" min={0} max={2147483647} step={1} required value={price} onChange={(event) => setPrice(event.target.value)} />
              </Form.Group>
              <Form.Group controlId="draft-ram">
                <Form.Label className="draft__label">RAM, ГБ</Form.Label>
                <Form.Control className="draft__input" type="number" min={1} max={2147483647} step={1} required value={ram} onChange={(event) => setRam(event.target.value)} />
              </Form.Group>
            </div>
          </>}
          <Button className="draft__submit" type="submit" disabled={busy}>
            {detailsStep ? 'Опубликовать' : 'Далее'}
          </Button>
        </Form>
        {draft && <Button className="tariff-delete" variant="outline-danger" disabled={busy}
          onClick={() => dispatch(deleteTariff(draft.tariff_id))}>Удалить черновик</Button>}
      </main>
    </div>
  );
}
