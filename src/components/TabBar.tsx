import Navbar from 'react-bootstrap/Navbar';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

export function TabBar() {
  return (
    <Navbar className="tabbar" aria-label="Основная навигация">
      <NavLink to="/tariffs/feed" className={({ isActive }) => `tabbar__item${isActive ? ' tabbar__item--active' : ''}`}>
        <Icon name="feed" /><span>Лента</span>
      </NavLink>
      <button className="tabbar__item" type="button" disabled title="Недоступно в гостевом режиме">
        <Icon name="draft" /><span>Добавление</span>
      </button>
      <NavLink to="/tariffs" end className={({ isActive }) => `tabbar__item${isActive ? ' tabbar__item--active' : ''}`}>
        <Icon name="tiles" /><span>Плитка</span>
      </NavLink>
      <button className="tabbar__item" type="button" disabled title="Вход будет реализован в следующей лабораторной">
        <Icon name="login" /><span>Вход</span>
      </button>
    </Navbar>
  );
}
