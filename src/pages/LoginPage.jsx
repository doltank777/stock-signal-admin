import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage(
        '이메일과 비밀번호를 입력해 주세요.'
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await login(
        email.trim(),
        password
      );

      navigate('/dashboard', {
        replace: true,
      });
    } catch (error) {
      const backendMessage =
        error.response?.data?.message;

      setErrorMessage(
        backendMessage ||
          error.message ||
          '로그인에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <div className="login-logo">
            S
          </div>

          <div>
            <div className="login-brand-title">
              Stock Signal
            </div>

            <div className="login-brand-subtitle">
              ADMIN
            </div>
          </div>
        </div>

        <div className="login-heading">
          <h1>관리자 로그인</h1>

          <p>
            관리자 계정으로 로그인해 주세요.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="email">
              이메일
            </label>

            <input
              id="email"
              type="email"
              value={email}
              placeholder="admin@example.com"
              autoComplete="username"
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">
              비밀번호
            </label>

            <input
              id="password"
              type="password"
              value={password}
              placeholder="비밀번호"
              autoComplete="current-password"
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </div>

          {errorMessage && (
            <div className="login-error">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={submitting}
          >
            {submitting
              ? '로그인 중...'
              : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;