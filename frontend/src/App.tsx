import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './layout/Layout';
import RequireAdmin from './components/auth/RequireAdmin';
import RequireAuth from './components/auth/RequireAuth';
import RequireGuest from './components/auth/RequireGuest';
import Activate from './pages/Activate';
import AdminDashboard from './pages/AdminDashboard';
import AccountSettings from './pages/AccountSettings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Fridge from './pages/fridge/Fridge';
import FridgeSearch from './pages/fridge/FridgeSearch';
import FridgeFavorites from './pages/FridgeFavorites';
import Home from './pages/Home';
import Login from './pages/Login';
import RecipeDetails from './pages/recipe-details/RecipeDetails';
import Recepti from './pages/recipes/Recepti';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import WeeklyPlan from './pages/WeeklyPlan';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recepti />} />
        <Route path="/recipes/:id" element={<RecipeDetails />} />
        <Route
          path="/fridge"
          element={
            <RequireAuth>
              <Fridge />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="search" replace />} />
          <Route path="search" element={<FridgeSearch />} />
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
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />
        <Route
          path="/register"
          element={
            <RequireGuest>
              <Register />
            </RequireGuest>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RequireGuest>
              <ForgotPassword />
            </RequireGuest>
          }
        />
        <Route
          path="/reset-password"
          element={
            <RequireGuest>
              <ResetPassword />
            </RequireGuest>
          }
        />
        <Route path="/activate" element={<Activate />} />
      </Route>
    </Routes>
  );
}

export default App;
