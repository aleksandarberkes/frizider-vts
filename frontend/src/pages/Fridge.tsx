import { Outlet } from 'react-router-dom';
import FridgeTabs from '../components/auth/fridge-tabs/FridgeTabs';
import './Fridge.css';

function Fridge() {
  return (
    <section className="fridge-page">
      <div className="fridge-shell">
        <FridgeTabs />

        <div className="fridge-panel">
          <Outlet />
        </div>
      </div>
    </section>
  );
}

export default Fridge;
