import './App.css';
import { Route, Routes } from 'react-router-dom';
import Layout from './layout/Layout';
import Favorites from './pages/Favorites';
import Fridge from './pages/Fridge';
import Home from './pages/Home';
import Login from './pages/Login';
import Recepti from './pages/Recepti';
import Register from './pages/Register';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recepti />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/fridge" element={<Fridge />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
    </Routes>
  );
}

export default App;
