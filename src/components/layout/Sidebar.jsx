import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function Sidebar() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  function handleLogout() {
    logout();

    navigate('/login', {
      replace: true,
    });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          S
        </div>

        <div>
          <div className="sidebar-title">
            Stock Signal
          </div>

          <div className="sidebar-subtitle">
            ADMIN
          </div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-menu-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="sidebar-menu-icon">
            ▦
          </span>

          대시보드
        </NavLink>

        <NavLink
          to="/users"
          className={({ isActive }) =>
            `sidebar-menu-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="sidebar-menu-icon">
            ◎
          </span>

          회원 관리
        </NavLink>

        <NavLink
          to="/search-conditions"
          className={({ isActive }) =>
            `sidebar-menu-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="sidebar-menu-icon">
            ⌕
          </span>

          검색식 관리
        </NavLink>

        <NavLink
          to="/operational-realtime"
          className={({ isActive }) =>
            `sidebar-menu-item ${
              isActive ? 'active' : ''
            }`
          }
        >
          <span className="sidebar-menu-icon">
            ◉
          </span>

          운영 실시간 감시
        </NavLink>
      </nav>

      <div className="sidebar-account">
        <div className="sidebar-account-label">
          로그인 관리자
        </div>

        <div className="sidebar-account-name">
          {user?.nickname || '관리자'}
        </div>

        <div className="sidebar-account-email">
          {user?.email || ''}
        </div>

        <button
          type="button"
          className="sidebar-logout-button"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </div>

      <div className="sidebar-footer">
        Stock Signal Admin
      </div>
    </aside>
  );
}

export default Sidebar;
