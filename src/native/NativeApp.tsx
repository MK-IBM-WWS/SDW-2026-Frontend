import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Form, Navbar, Spinner } from 'react-bootstrap';
import { HashRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Pagination } from '../components/Pagination';
import { formatNumber, PRICE_STEPS } from '../modules/priceFilter';
import { publicAsset } from '../modules/environment';
import { loadCatalogPage, loadDetails, loadSearchCorpus, serverFetch } from './api';
import { useAutoRefresh } from './useAutoRefresh';
import { useClip } from './useClip';
import { DEFAULT_THRESHOLD, DEFAULT_TOP_K } from './search';
import type { NativeTariff } from './types';
import './native.css';

function Image({item,revision,className}:{item:NativeTariff;revision:number;className:string}){
 const [src,setSrc]=useState(publicAsset('media/example.jpg'));
 useEffect(()=>{
  const controller=new AbortController();let objectURL='';
  void serverFetch(item.image_url,controller.signal).then(response=>response.blob()).then(blob=>{
   if(controller.signal.aborted)return;
   objectURL=URL.createObjectURL(blob);setSrc(objectURL);
  }).catch(()=>{if(!controller.signal.aborted)setSrc(publicAsset('media/example.jpg'));});
  return()=>{controller.abort();if(objectURL)URL.revokeObjectURL(objectURL);};
 },[item.image_url,revision]);
 return <img className={className} src={src} alt={item.tariff_name} onError={()=>setSrc(publicAsset('media/example.jpg'))}/>;
}
function TariffTile({tariff,revision}:{tariff:NativeTariff;revision:number}){
 return <Card as="article" className="tile">
  <Link className="tile__link" to={`/tariffs/feed?id=${tariff.tariff_id}`} aria-label={`Открыть тариф ${tariff.tariff_name}`}>
   <Image className="tile__image card-img" item={tariff} revision={revision}/>
   <Card.Body className="tile__body">
    <Card.Title as="h2" className="tile__name" title={tariff.tariff_name}>{tariff.tariff_name}</Card.Title>
    <Card.Text className="tile__price">{formatNumber(tariff.price_per_month)} ₽ / месяц</Card.Text>
    <span className="tile__likes" aria-label={`Лайков: ${tariff.like_count??0}`}><Icon name="heart"/>{tariff.like_count??0}</span>
    <span className="tile__open" aria-hidden="true">›</span>
   </Card.Body>
  </Link>
 </Card>;
}
function Detail({first,next,remember}:{first:NativeTariff|undefined;next:(id:number)=>number;remember:(id:number)=>void}){
 const [params,setParams]=useSearchParams();
 const requested=Number(params.get('id'));
 const id=requested>0?requested:first?.tariff_id;
 const request=useCallback((signal:AbortSignal)=>loadDetails(id!,signal),[id]);
 const {data:tariff,loading,error,revision}=useAutoRefresh(id?request:null);
 const [expanded,setExpanded]=useState(false);
 useEffect(()=>{setExpanded(false);if(id)remember(id);},[id,remember]);
 useEffect(()=>{document.title=tariff?.tariff_name||'Лента тарифов';},[tariff]);
 if(error)return <main className="message-page"><h1>Тариф не найден</h1><Link to="/tariffs">Вернуться к плитке</Link></main>;
 if(!tariff)return <main className="message-page"><h1>{loading?'Загрузка…':'Тариф не найден'}</h1><Link to="/tariffs">Вернуться к плитке</Link></main>;
 const words=tariff.short_description.split(' ');
 return <main className="feed" aria-label="Лента тарифов">
  <Image item={tariff} revision={revision} className="feed__video"/>
  <div className="feed__overlay" aria-hidden="true"/>
  <section className="feed__content">
   <h1 className="feed__title">{tariff.tariff_name}</h1>
   <div className="feed__description"><p id="tariff-description">{expanded?tariff.short_description:words.slice(0,3).join(' ')}</p>
    {words.length>3&&<Button variant="link" className="feed__more" aria-expanded={expanded} aria-controls="tariff-description" onClick={()=>setExpanded(!expanded)}>{expanded?'свернуть':'ещё…'}</Button>}
   </div>
   <p className="feed__price">{formatNumber(tariff.price_per_month)} ₽ / месяц</p>
  </section>
  <aside className="feed__actions" aria-label="Параметры тарифа">
   <div className="feed__ram" aria-label={`Оперативная память: ${tariff.ram_gb} ГБ`}>
    <span className="feed__ram-icon-frame" aria-hidden="true"><img className="feed__ram-icon" src={publicAsset('images/ram.png')} alt=""/></span>
    <strong className="feed__ram-value">{tariff.ram_gb} ГБ</strong>
   </div>
   <div className="feed__likes" aria-label={`Лайков: ${tariff.like_count??0}`}>
    <Button className="feed__like-button" disabled aria-label="Лайки"><Icon name="heart"/></Button><strong>{tariff.like_count??0}</strong>
   </div>
   <Button className="feed__next" onClick={()=>setParams({id:String(next(tariff.tariff_id))})} aria-label="Следующий тариф"><Icon name="next"/></Button>
  </aside>
 </main>;
}
function NativeContent(){
 const location=useLocation();
 useEffect(()=>{if(location.pathname==='/tariffs')document.title='Тарифы облачного хостинга';},[location.pathname]);
 const [query,setQuery]=useState(''),[applied,setApplied]=useState(''),[page,setPage]=useState(1);
 const [priceStep,setPriceStep]=useState(0),[appliedPriceStep,setAppliedPriceStep]=useState(0);
 const priceLimit=PRICE_STEPS[appliedPriceStep].value;
 const [selectedFile,setSelectedFile]=useState<File|null>(null),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState('');
 const [inputError,setInputError]=useState(''),[lastId,setLastId]=useState<number|undefined>();
 const input=useRef<HTMLInputElement>(null);
 const listRequest=useCallback((signal:AbortSignal)=>loadCatalogPage(applied,page,signal,priceLimit),[applied,page,priceLimit]);
 const corpusRequest=useCallback((signal:AbortSignal)=>loadSearchCorpus(applied,signal),[applied]);
 const catalog=useAutoRefresh(listRequest),corpus=useAutoRefresh(file?corpusRequest:null);
 // The semantic endpoint returns all descriptions. Apply price before CLIP's TopK.
 const corpusItems=useMemo(()=>{
  const rows=corpus.data??[];
  return priceLimit?rows.filter(item=>item.price_per_month<=Number(priceLimit)):rows;
 },[corpus.data,priceLimit]);
 const clip=useClip(corpusItems,file&&corpus.data!==null&&!corpus.loading?file:null,DEFAULT_THRESHOLD,DEFAULT_TOP_K);
 const aiActive=Boolean(file);
 const items=aiActive?clip.results:catalog.data?.data??[];
 const total=aiActive?clip.results.length:catalog.data?.total??0;
 const pages=Math.max(1,Math.ceil(total/12)),currentPage=Math.min(page,pages);
 useEffect(()=>{if(page>pages&&!catalog.loading&&!aiActive)setPage(pages);},[page,pages,catalog.loading,aiActive]);
 useEffect(()=>{
  if(!selectedFile){setPreview('');return;}
  const url=URL.createObjectURL(selectedFile);setPreview(url);return()=>URL.revokeObjectURL(url);
 },[selectedFile]);
 const remember=useCallback((id:number)=>setLastId(id),[]);
 const next=useCallback((id:number)=>{
  const index=items.findIndex(item=>item.tariff_id===id);
  return items[(index+1)%items.length]?.tariff_id??id;
 },[items]);
 const error=inputError||catalog.error||corpus.error||clip.error;
 const busy=aiActive?(corpus.loading||clip.busy):catalog.loading;
 const listing=<div className="page page--pattern page--tariffs">
  <header className="page-header"><h1 className="page-header__title">Тарифы</h1></header>
  <Form className="filter" onSubmit={event=>{event.preventDefault();setApplied(query);setAppliedPriceStep(priceStep);setFile(selectedFile);setPage(1);}}>
   <div className="filter__range-wrap">
    <Form.Label className="filter__label" htmlFor="priceStep">
     Максимальная цена: <strong>{PRICE_STEPS[priceStep].label}</strong>
    </Form.Label>
    <Form.Range className="filter__range" id="priceStep" min={0} max={PRICE_STEPS.length-1} step={1}
     value={priceStep} aria-valuetext={PRICE_STEPS[priceStep].label} onChange={event=>setPriceStep(Number(event.target.value))}/>
    <Form.Label className="filter__label" htmlFor="native-search">Поиск</Form.Label>
    <div className="filter__controls native-search__controls">
     <Form.Control id="native-search" className="native-search__input" value={query} maxLength={100} placeholder="Название тарифа" onChange={event=>setQuery(event.target.value)}/>
     <input ref={input} className="draft__file" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Изображение для поиска" onChange={event=>{
      const image=event.target.files?.[0];if(!image)return;
      if(image.size>10*1024*1024){setInputError('Размер изображения должен быть не больше 10 МБ');event.target.value='';return;}
      setSelectedFile(image);setInputError('');
     }}/>
     <Button type="button" className="filter__submit" aria-label="Выбрать изображение" title="Выбрать изображение" onClick={()=>input.current?.click()}><Icon name="draft"/></Button>
     <Button type="submit" className="filter__submit" aria-label="Применить поиск и фильтр по цене" title="Применить поиск и фильтр по цене"><Icon name="search"/></Button>
    </div>
    {preview&&<div className="native-search__preview media-field__preview">
     <button type="button" className="media-field__picker" aria-label="Выбрать другое изображение" onClick={()=>input.current?.click()}><img src={preview} alt="Изображение для поиска"/></button>
     <Button className="tile__delete" type="button" aria-label="Убрать изображение" onClick={()=>{setSelectedFile(null);setFile(null);setPage(1);if(input.current)input.current.value='';}}><Icon name="close"/></Button>
    </div>}
   </div>
  </Form>
  <div className="tariff-stats" aria-live="polite"><span>Найдено: {total.toLocaleString('ru-RU')}</span></div>
  <main className="tiles tiles--paginated" aria-label="Список тарифов">
   <p className="visually-hidden" role="status">Найдено тарифов: {total}</p>
   {items.map(tariff=><TariffTile key={tariff.tariff_id} tariff={tariff} revision={catalog.revision+corpus.revision}/>)}
   {!busy&&!items.length&&<p className="empty-state">Тарифы не найдены.</p>}
  </main>
  <Pagination currentPage={currentPage} totalPages={pages} disabled={busy} onPageChange={setPage}/>
 </div>;
 return <div className="phone">
  {error&&<Alert className="tariff-alert" variant="danger" role="alert">{error}</Alert>}
  <Routes>
   <Route path="/" element={<Navigate to="/tariffs" replace/>}/>
   <Route path="/tariffs" element={listing}/>
   <Route path="/tariffs/feed" element={<Detail first={items[0]} next={next} remember={remember}/>}/>
   <Route path="*" element={<Navigate to="/tariffs" replace/>}/>
  </Routes>
  <Navbar className="tabbar tabbar--native" aria-label="Основная навигация">
   <NavLink to={`/tariffs/feed${lastId?`?id=${lastId}`:''}`} className={({isActive})=>`tabbar__item${isActive?' tabbar__item--active':''}`}><Icon name="feed"/><span>Лента</span></NavLink>
   <NavLink to="/tariffs" end className={({isActive})=>`tabbar__item${isActive?' tabbar__item--active':''}`}><Icon name="tiles"/><span>Плитка</span></NavLink>
  </Navbar>
  {busy&&<div className="tariff-loading" role="status" aria-live="polite"><Spinner animation="border"/><span>Загрузка…</span></div>}
 </div>;
}
export default function NativeApp(){return <HashRouter><NativeContent/></HashRouter>;}
