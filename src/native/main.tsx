import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';
import '../pages.css';
import NativeApp from './NativeApp';
document.title='Тарифы облачного хостинга';
createRoot(document.getElementById('root')!).render(<StrictMode><NativeApp/></StrictMode>);
