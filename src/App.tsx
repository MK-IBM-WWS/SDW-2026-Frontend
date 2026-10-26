import { useState } from 'react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { getPublishedTariffs } from './modules/mock';
import { TilesPage } from './pages/TilesPage';
import { FeedPage } from './pages/FeedPage';
import { DraftPage } from './pages/DraftPage';

export default function App() {
  // Коллекция общая для плитки и ленты, передаётся обычными props.
  const [tariffs] = useState(getPublishedTariffs);

  return (
    <div className="phone">
      <Routes>
        <Route path="/" element={<Navigate to="/tariffs" replace />} />
        <Route path="/tariffs" element={<TilesPage tariffs={tariffs} />} />
        <Route path="/tariffs/feed" element={<FeedPage tariffs={tariffs} />} />
        <Route path="/tariffs/draft" element={<DraftPage />} />
        <Route path="*" element={<main className="message-page"><h1>Страница не найдена</h1><Link to="/tariffs">Вернуться к плитке</Link></main>} />
      </Routes>
      <TabBar />
    </div>
  );
}
