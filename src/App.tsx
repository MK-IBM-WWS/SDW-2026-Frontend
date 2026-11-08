import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';
import { TabBar } from './components/TabBar';
import { TilesPage } from './pages/TilesPage';
import { FeedPage } from './pages/FeedPage';
import { DraftPage } from './pages/DraftPage';
import { LoginPage } from './pages/LoginPage';
import { useTariffDispatch, useTariffSelector } from './store';
import { tariffInterfaceError } from './store/interfaceSlice';

export default function App() {
  const dispatch = useTariffDispatch();
  const { pending, error } = useTariffSelector((state) => state.tariffInterface);
  const authenticated = useTariffSelector((state) => state.tariffUser.isAuthenticated);
  return (
    <div className="phone" aria-busy={pending > 0}>
      {error && <Alert className="tariff-alert" variant="danger" dismissible
        onClose={() => dispatch(tariffInterfaceError(''))}>{error}</Alert>}
      <div inert={pending > 0}>
        <Routes>
          <Route path="/" element={<Navigate to="/tariffs" replace />} />
          <Route path="/tariffs" element={<TilesPage />} />
          <Route path="/tariffs/feed" element={<FeedPage />} />
          <Route path="/tariffs/draft" element={authenticated ? <DraftPage /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={authenticated ? <Navigate to="/tariffs" replace /> : <LoginPage />} />
          <Route path="*" element={<main className="message-page"><h1>Страница не найдена</h1><Link to="/tariffs">Вернуться к плитке</Link></main>} />
        </Routes>
        <TabBar />
      </div>
      {pending > 0 && <div className="tariff-loading" role="status" aria-live="polite">
        <Spinner animation="border" /><span>Загрузка…</span>
      </div>}
    </div>
  );
}
