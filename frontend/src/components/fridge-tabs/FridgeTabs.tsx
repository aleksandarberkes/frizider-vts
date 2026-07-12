import { NavLink } from 'react-router-dom';
import './fridgeTabs.css';

function FridgeTabs() {
  return (
    <nav className="fridge-tabs" aria-label="Moj frizider sekcije">
      <NavLink
        to="/fridge/search"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        <img className='tab-icon' src="/appicons/fridge-icon.svg" alt="Frigde icon" />
        Moj frizider
      </NavLink>
      <NavLink
        to="/fridge/favorites"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        <img src="/appicons/fav-icon.svg" alt="Favorites icon" className="tab-icon" />
        Omiljeni
      </NavLink>
      <NavLink
        to="/fridge/weekly-plan"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        <img className='tab-icon' src="/appicons/weekly-icon.svg" alt="Frigde icon" />
        Nedeljni plan
      </NavLink>
      <NavLink
        to="/fridge/profile"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        <img src="/appicons/user-icon.svg" alt="User icon" className="tab-icon" />
        Profil
      </NavLink>
      <NavLink
        to="/fridge/settings"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        <img src="/appicons/settings-icon.svg" alt="Setting icon" className="tab-icon" />
        Podesavanja
      </NavLink>
    </nav>
  );
}

export default FridgeTabs;
