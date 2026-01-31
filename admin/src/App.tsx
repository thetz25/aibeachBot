import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CarList } from './pages/CarList';
import { CarForm } from './pages/CarForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/cars" replace />} />
          <Route path="cars" element={<CarList />} />
          <Route path="cars/new" element={<CarForm />} />
          <Route path="cars/:id/edit" element={<CarForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
