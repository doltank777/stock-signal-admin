import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getMyInfo,
  login as loginApi,
} from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setInitializing(false);
      return;
    }

    try {
      const userInfo = await getMyInfo();

      if (userInfo.role !== 'ADMIN') {
        localStorage.removeItem('accessToken');
        setUser(null);
        return;
      }

      setUser(userInfo);
    } catch (error) {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }

  async function login(email, password) {
    const loginResponse = await loginApi(email, password);

    localStorage.setItem(
      'accessToken',
      loginResponse.accessToken
    );

    try {
      const userInfo = await getMyInfo();

      if (userInfo.role !== 'ADMIN') {
        localStorage.removeItem('accessToken');
        setUser(null);

        throw new Error(
          '관리자 권한이 없는 계정입니다.'
        );
      }

      setUser(userInfo);

      return userInfo;
    } catch (error) {
      localStorage.removeItem('accessToken');
      setUser(null);

      throw error;
    }
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setUser(null);
  }

  const value = {
    user,
    initializing,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth는 AuthProvider 내부에서 사용해야 합니다.'
    );
  }

  return context;
}