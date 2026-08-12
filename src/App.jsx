import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import SearchConditionPage from './pages/SearchConditionPage';

function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/search-conditions"
          element={<SearchConditionPage />}
        />
      </Route>
    </Routes>
  );
}

export default App;