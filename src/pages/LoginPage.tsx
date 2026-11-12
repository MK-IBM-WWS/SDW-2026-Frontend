import { useState } from 'react';
import { MOCK_ONLY } from '../modules/environment';
import type { FormEvent } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { tariffUserHttp, setActiveTariffToken, tariffErrorMessage } from '../api';
import { useTariffDispatch, useTariffSelector } from '../store';
import { tariffUserLoggedIn } from '../store/userSlice';
import { tariffAuthStarted, tariffAuthFinished, tariffInterfaceError } from '../store/interfaceSlice';

export function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useTariffDispatch();
  const navigate = useNavigate();
  const busy = useTariffSelector((state) => state.tariffInterface.pending > 0);
  usePageTitle('Вход');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    dispatch(tariffAuthStarted());
    try {
      const response = await tariffUserHttp.post('/users/login', { login, password });
      const data = response.data.data;
      if (!data?.access_token || !data.user_id) throw new Error('Некорректный ответ авторизации');
      localStorage.setItem('cloud_tariffs_jwt', data.access_token);
      setActiveTariffToken(data.access_token);
      dispatch(tariffUserLoggedIn({ login: login.trim().toLowerCase(), userId: data.user_id }));
      navigate('/tariffs', { replace: true });
    } catch (error) { dispatch(tariffInterfaceError(tariffErrorMessage(error))); }
    finally { dispatch(tariffAuthFinished()); }
  };
  return <div className="page page--pattern">
    <header className="page-header"><h1 className="page-header__title">Вход</h1></header>
    <main className="draft">{MOCK_ONLY && <p role="status">На GitHub Pages доступен просмотр mock-тарифов. Для входа откройте HTTPS-адрес ноутбука в локальной сети.</p>}<Form onSubmit={submit}>
      <Form.Group controlId="tariff-login"><Form.Label>Логин</Form.Label>
        <Form.Control className="draft__input" required autoComplete="username" maxLength={50}
          value={login} onChange={(event) => setLogin(event.target.value)} /></Form.Group>
      <Form.Group controlId="tariff-password"><Form.Label>Пароль</Form.Label>
        <Form.Control className="draft__input" type="password" required autoComplete="current-password"
          value={password} onChange={(event) => setPassword(event.target.value)} /></Form.Group>
      <Button className="draft__submit" type="submit" disabled={busy || MOCK_ONLY}>Войти</Button>
    </Form></main>
  </div>;
}
