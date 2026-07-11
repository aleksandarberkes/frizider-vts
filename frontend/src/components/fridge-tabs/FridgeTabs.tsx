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
        Moj frizider
      </NavLink>
      <NavLink
        to="/fridge/favorites"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        <img src="/icons/fav-icon.svg" alt="Favorites icon" className="tab-icon" />
        Omiljeni
      </NavLink>
      <NavLink
        to="/fridge/weekly-plan"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        Nedeljni plan
      </NavLink>
      <NavLink
        to="/fridge/profile"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        <img src="/icons/user-icon.svg" alt="User icon" className="tab-icon" />
        Profil
      </NavLink>
      <NavLink
        to="/fridge/settings"
        className={({ isActive }) =>
          isActive ? 'fridge-tab fridge-tab-active' : 'fridge-tab'
        }
      >
        <img src="/icons/settings-icon.svg" alt="Setting icon" className="tab-icon" />
        Podesavanja
      </NavLink>
    </nav>
  );
}

export default FridgeTabs;
