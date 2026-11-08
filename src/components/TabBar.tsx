import Navbar from 'react-bootstrap/Navbar';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { useTariffDispatch, useTariffSelector } from '../store';
import { tariffUserHttp, setActiveTariffToken, getActiveTariffToken, tariffErrorMessage } from '../api';
import { tariffUserLoggedOut } from '../store/userSlice';
import { tariffAuthStarted, tariffAuthFinished, tariffInterfaceError } from '../store/interfaceSlice';

export function TabBar() {
  const dispatch = useTariffDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, login } = useTariffSelector((state) => state.tariffUser);
  const busy = useTariffSelector((state) => state.tariffInterface.pending > 0);
  const logout = async () => {
    if (busy) return;
    dispatch(tariffAuthStarted());
    try {
      const token = getActiveTariffToken();
      await tariffUserHttp.post('/users/logout', undefined, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem('cloud_tariffs_jwt');
      setActiveTariffToken('');
      dispatch(tariffUserLoggedOut()); // одновременно очищает фильтр и тарифы
      navigate('/tariffs');
    } catch (error) { dispatch(tariffInterfaceError(tariffErrorMessage(error))); }
    finally { dispatch(tariffAuthFinished()); }
  };
  const navClass = ({ isActive }: { isActive: boolean }) => `tabbar__item${isActive ? ' tabbar__item--active' : ''}`;
  return (
    <Navbar className="tabbar" aria-label="Основная навигация">
      <NavLink to="/tariffs/feed" className={navClass}><Icon name="feed" /><span>Лента</span></NavLink>
      {isAuthenticated
        ? <NavLink to="/tariffs/draft" className={navClass}><Icon name="draft" /><span>Добавление</span></NavLink>
        : <button className="tabbar__item" type="button" disabled title="Сначала войдите"><Icon name="draft" /><span>Добавление</span></button>}
      <NavLink to="/tariffs" end className={navClass}><Icon name="tiles" /><span>Плитка</span></NavLink>
      {isAuthenticated
        ? <button className="tabbar__item" type="button" disabled={busy} title={`Выйти: ${login}`} onClick={logout}><Icon name="login" /><span>Выход</span></button>
        : <NavLink to="/login" className={navClass}><Icon name="login" /><span>Вход</span></NavLink>}
    </Navbar>
  );
}
