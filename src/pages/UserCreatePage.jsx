import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAdminUser } from '../api/adminUserApi';
import { koreaDateTimeLocalToInstant } from '../utils/dateTime';

const INITIAL_FORM = {
  email: '',
  nickname: '',
  password: '',
  role: 'USER',
  membershipType: 'FREE',
  membershipStartedAt: '',
  membershipExpiredAt: '',
  phoneNumber: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function UserCreatePage() {
  const navigate = useNavigate();
  const submittingRef = useRef(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setApiError('');
  }

  function handleMembershipChange(event) {
    const membershipType = event.target.value;
    setForm((current) => ({
      ...current,
      membershipType,
      membershipStartedAt:
        membershipType === 'FREE' ? '' : current.membershipStartedAt,
      membershipExpiredAt:
        membershipType === 'FREE' ? '' : current.membershipExpiredAt,
    }));
    setErrors((current) => ({
      ...current,
      membershipType: '',
      membershipStartedAt: '',
      membershipExpiredAt: '',
    }));
    setApiError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setApiError('');
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const user = await createAdminUser(buildRequest(form));
      navigate(`/users/${user.id}`, {
        replace: true,
        state: { successMessage: '회원이 등록되었습니다.' },
      });
    } catch (error) {
      setApiError(
        error.response?.data?.message || '회원 등록에 실패했습니다.'
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const paid = form.membershipType === 'PAID';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>회원 등록</h1>
          <p>새로운 사용자를 등록합니다.</p>
        </div>
      </div>

      <form className="user-create-form" onSubmit={handleSubmit}>
        <section className="content-card">
          <div className="content-card-header">
            <h2>기본 정보</h2>
          </div>
          <div className="user-create-grid">
            <FormField label="이메일" field="email" error={errors.email}>
              <input
                id="email"
                type="email"
                maxLength="100"
                autoComplete="off"
                value={form.email}
                disabled={submitting}
                onChange={(event) => updateForm('email', event.target.value)}
              />
            </FormField>
            <FormField label="닉네임" field="nickname" error={errors.nickname}>
              <input
                id="nickname"
                type="text"
                maxLength="50"
                autoComplete="off"
                value={form.nickname}
                disabled={submitting}
                onChange={(event) => updateForm('nickname', event.target.value)}
              />
            </FormField>
            <FormField label="비밀번호" field="password" error={errors.password}>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                disabled={submitting}
                onChange={(event) => updateForm('password', event.target.value)}
              />
            </FormField>
            <FormField label="Role" field="role" error={errors.role}>
              <select
                id="role"
                value={form.role}
                disabled={submitting}
                onChange={(event) => updateForm('role', event.target.value)}
              >
                <option value="USER">일반 사용자 (USER)</option>
                <option value="ADMIN">관리자 (ADMIN)</option>
              </select>
            </FormField>
          </div>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h2>회원 등급 정보</h2>
          </div>
          <div className="user-create-grid user-create-membership-grid">
            <FormField
              label="회원 등급"
              field="membershipType"
              error={errors.membershipType}
            >
              <select
                id="membershipType"
                value={form.membershipType}
                disabled={submitting}
                onChange={handleMembershipChange}
              >
                <option value="FREE">무료 회원 (FREE)</option>
                <option value="PAID">유료 회원 (PAID)</option>
              </select>
            </FormField>
            {paid && (
              <>
                <FormField
                  label="등급 시작일시 (KST)"
                  field="membershipStartedAt"
                  error={errors.membershipStartedAt}
                >
                  <input
                    id="membershipStartedAt"
                    type="datetime-local"
                    value={form.membershipStartedAt}
                    disabled={submitting}
                    onChange={(event) =>
                      updateForm('membershipStartedAt', event.target.value)
                    }
                  />
                </FormField>
                <FormField
                  label="등급 만료일시 (KST)"
                  field="membershipExpiredAt"
                  error={errors.membershipExpiredAt}
                >
                  <input
                    id="membershipExpiredAt"
                    type="datetime-local"
                    value={form.membershipExpiredAt}
                    disabled={submitting}
                    onChange={(event) =>
                      updateForm('membershipExpiredAt', event.target.value)
                    }
                  />
                </FormField>
              </>
            )}
          </div>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <h2>전화번호</h2>
          </div>
          <div className="user-create-phone-field">
            <FormField
              label="전화번호"
              field="phoneNumber"
              error={errors.phoneNumber}
            >
              <input
                id="phoneNumber"
                type="tel"
                autoComplete="off"
                value={form.phoneNumber}
                disabled={submitting}
                onChange={(event) =>
                  updateForm('phoneNumber', event.target.value)
                }
              />
            </FormField>
          </div>
        </section>

        {apiError && <div className="submit-error" role="alert">{apiError}</div>}

        <div className="user-create-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={submitting}
            onClick={() => navigate('/users')}
          >
            취소
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, field, error, children }) {
  return (
    <div className="form-field">
      <label htmlFor={field}>{label} *</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function validateForm(form) {
  const errors = {};
  if (!form.email.trim()) {
    errors.email = '이메일을 입력해 주세요.';
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = '올바른 이메일 형식을 입력해 주세요.';
  }
  if (!form.nickname.trim()) {
    errors.nickname = '닉네임을 입력해 주세요.';
  }
  if (!form.password) {
    errors.password = '비밀번호를 입력해 주세요.';
  }
  if (!form.role) {
    errors.role = 'Role을 선택해 주세요.';
  }
  if (!form.membershipType) {
    errors.membershipType = '회원 등급을 선택해 주세요.';
  }
  if (!form.phoneNumber.trim()) {
    errors.phoneNumber = '전화번호를 입력해 주세요.';
  }
  if (form.membershipType === 'PAID') {
    if (!form.membershipStartedAt) {
      errors.membershipStartedAt = '등급 시작일시를 입력해 주세요.';
    }
    if (!form.membershipExpiredAt) {
      errors.membershipExpiredAt = '등급 만료일시를 입력해 주세요.';
    }
    if (
      form.membershipStartedAt &&
      form.membershipExpiredAt &&
      form.membershipExpiredAt <= form.membershipStartedAt
    ) {
      errors.membershipExpiredAt =
        '만료일시는 시작일시보다 이후여야 합니다.';
    }
  }
  return errors;
}

function buildRequest(form) {
  const request = {
    email: form.email.trim(),
    password: form.password,
    nickname: form.nickname.trim(),
    phoneNumber: form.phoneNumber.trim(),
    role: form.role,
    membershipType: form.membershipType,
    membershipStartedAt: null,
    membershipExpiredAt: null,
  };
  if (form.membershipType === 'PAID') {
    request.membershipStartedAt = koreaDateTimeLocalToInstant(
      form.membershipStartedAt
    );
    request.membershipExpiredAt = koreaDateTimeLocalToInstant(
      form.membershipExpiredAt
    );
  }
  return request;
}

export default UserCreatePage;
