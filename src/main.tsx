import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import './pages.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store';
import { registerPwa } from './registerPwa';

const route = new URL(location.href).searchParams.get('__spa');
const base = import.meta.env.BASE_URL;
if (route?.startsWith(base) && !route.startsWith('//')) history.replaceState(null, '', route);

createRoot(document.getElementById('root')!).render(
  <StrictMode><Provider store={store}><BrowserRouter basename={base}><App /></BrowserRouter></Provider></StrictMode>,
);

registerPwa();
