import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">S</div>

        <div>
          <div className="sidebar-title">Stock Signal</div>
          <div className="sidebar-subtitle">ADMIN</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-menu-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-menu-icon">▦</span>
          대시보드
        </NavLink>

        <NavLink
          to="/search-conditions"
          className={({ isActive }) =>
            `sidebar-menu-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="sidebar-menu-icon">⌕</span>
          검색식 관리
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        Stock Signal Admin
      </div>
    </aside>
  );
}

export default Sidebar;