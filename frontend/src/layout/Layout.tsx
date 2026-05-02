import { Outlet } from 'react-router-dom';
import Header from '../components/header/Header';
import './Layout.css';

function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
