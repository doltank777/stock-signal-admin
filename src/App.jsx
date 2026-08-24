import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import OperationalRealtimePage from './pages/OperationalRealtimePage';
import SearchConditionCreatePage from './pages/SearchConditionCreatePage';
import DeletedSearchConditionPage from './pages/DeletedSearchConditionPage';
import SearchConditionPage from './pages/SearchConditionPage';
import UserDetailPage from './pages/UserDetailPage';
import UserManagementPage from './pages/UserManagementPage';

import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            <Route
              path="/operational-realtime"
              element={<OperationalRealtimePage />}
            />

            <Route
              path="/users"
              element={<UserManagementPage />}
            />

            <Route
              path="/users/:id"
              element={<UserDetailPage />}
            />

            <Route
              path="/search-conditions"
              element={
                <SearchConditionPage />
              }
            />

            <Route
              path="/search-conditions/new"
              element={
                <SearchConditionCreatePage />
              }
            />

            <Route
              path="/search-conditions/deleted"
              element={
                <DeletedSearchConditionPage />
              }
            />

            <Route
              path="/search-conditions/:id/edit"
              element={
                <SearchConditionCreatePage mode="edit" />
              }
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
