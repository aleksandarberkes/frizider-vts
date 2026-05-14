import './App.css';
import { Route, Routes } from 'react-router-dom';
import Layout from './layout/Layout';
import RequireAdmin from './components/auth/RequireAdmin';
import RequireAuth from './components/auth/RequireAuth';
import AdminDashboard from './pages/AdminDashboard';
import AccountSettings from './pages/AccountSettings';
import Favorites from './pages/Favorites';
import Fridge from './pages/Fridge';
import FridgeFavorites from './pages/FridgeFavorites';
import Home from './pages/Home';
import Login from './pages/Login';
import Recepti from './pages/Recepti';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import WeeklyPlan from './pages/WeeklyPlan';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recepti />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route
          path="/fridge"
          element={
            <RequireAuth>
              <Fridge />
            </RequireAuth>
          }
        >
          <Route index element={<UserProfile />} />
          <Route path="favorites" element={<FridgeFavorites />} />
          <Route path="weekly-plan" element={<WeeklyPlan />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>
        <Route
          path="/admin/dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
    </Routes>
  );
}

export default App;
