import { useCallback, useEffect, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  getAdminUser,
  updateAdminUserMembership,
} from '../api/adminUserApi';
import {
  formatKoreaDateTime,
  instantToKoreaDateTimeLocal,
  koreaDateTimeLocalToInstant,
} from '../utils/dateTime';

const MEMBERSHIP_LABELS = {
  FREE: '무료',
  PAID_SCHEDULED: '유료 예정',
  PAID_ACTIVE: '유료',
  PAID_EXPIRED: '유료 만료',
};

const ROLE_LABELS = {
  USER: '일반회원',
  ADMIN: '관리자',
};

function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [membershipType, setMembershipType] = useState('FREE');
  const [startedAt, setStartedAt] = useState('');
  const [expiredAt, setExpiredAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  );

  const applyUser = useCallback((data) => {
    setUser(data);
    setMembershipType(data.membershipType);
    setStartedAt(
      instantToKoreaDateTimeLocal(data.membershipStartedAt)
    );
    setExpiredAt(
      instantToKoreaDateTimeLocal(data.membershipExpiredAt)
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      try {
        const data = await getAdminUser(id, controller.signal);
        applyUser(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(
            error.response?.data?.message ||
              '회원 정보를 불러오지 못했습니다.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => controller.abort();
  }, [applyUser, id]);

  function handleMembershipTypeChange(event) {
    const nextMembershipType = event.target.value;
    setMembershipType(nextMembershipType);
    setFormError('');
    setSuccessMessage('');

    if (nextMembershipType === 'FREE') {
      setStartedAt('');
      setExpiredAt('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    const request = buildRequest();

    if (!request) {
      return;
    }

    const confirmed = window.confirm(buildConfirmationMessage());

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const updatedUser = await updateAdminUserMembership(id, request);
      applyUser(updatedUser);
      setSuccessMessage('회원 등급이 변경되었습니다.');
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          '회원 등급 변경에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function buildRequest() {
    if (membershipType === 'FREE') {
      return { membershipType: 'FREE' };
    }

    if (!startedAt || !expiredAt) {
      setFormError('유료 시작일시와 만료일시를 모두 입력해 주세요.');
      return null;
    }

    if (expiredAt <= startedAt) {
      setFormError('유료 만료일시는 시작일시보다 이후여야 합니다.');
      return null;
    }

    const membershipStartedAt = koreaDateTimeLocalToInstant(startedAt);
    const membershipExpiredAt = koreaDateTimeLocalToInstant(expiredAt);

    if (!membershipStartedAt || !membershipExpiredAt) {
      setFormError('유료기간 형식이 올바르지 않습니다.');
      return null;
    }

    return {
      membershipType: 'PAID',
      membershipStartedAt,
      membershipExpiredAt,
    };
  }

  function buildConfirmationMessage() {
    if (membershipType === 'FREE') {
      return '무료회원으로 변경하시겠습니까?\n\n유료 시작/만료 정보가 초기화됩니다.';
    }

    return [
      '유료회원으로 변경하시겠습니까?',
      '',
      `시작: ${formatKoreaDateTime(koreaDateTimeLocalToInstant(startedAt))}`,
      `만료: ${formatKoreaDateTime(koreaDateTimeLocalToInstant(expiredAt))}`,
    ].join('\n');
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-state">회원 정보를 불러오는 중입니다.</div>
      </div>
    );
  }

  if (errorMessage || !user) {
    return (
      <div className="page-container">
        <div className="page-state page-state-error">
          <div role="alert">{errorMessage || '회원 정보를 찾을 수 없습니다.'}</div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/users')}
          >
            회원 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>회원 상세</h1>
          <p>회원 정보와 Membership 상태를 확인합니다.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate('/users')}
        >
          회원 목록으로 돌아가기
        </button>
      </div>

      <div className="user-detail-sections">
        <section className="content-card">
          <div className="content-card-header">
            <h2>기본 정보</h2>
          </div>
          <dl className="user-detail-grid">
            <div><dt>ID</dt><dd>{user.id}</dd></div>
            <div><dt>이메일</dt><dd>{user.email}</dd></div>
            <div><dt>닉네임</dt><dd>{user.nickname}</dd></div>
            <div><dt>Role</dt><dd>{ROLE_LABELS[user.role] || user.role}</dd></div>
            <div><dt>가입일</dt><dd>{formatKoreaDateTime(user.createdAt, true)}</dd></div>
            <div><dt>푸시 등록</dt><dd>{user.pushRegistered ? '등록' : '미등록'}</dd></div>
            <div><dt>푸시 토큰 수</dt><dd>{user.pushTokenCount}개</dd></div>
          </dl>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <div>
              <h2>회원 등급 관리</h2>
              <p>
                현재 상태: {MEMBERSHIP_LABELS[user.membershipStatus] || user.membershipStatus}
              </p>
            </div>
          </div>

          <form className="membership-form" onSubmit={handleSubmit}>
            <div className="membership-summary">
              <div><span>저장 등급</span><strong>{user.membershipType}</strong></div>
              <div><span>유료 시작</span><strong>{formatKoreaDateTime(user.membershipStartedAt)}</strong></div>
              <div><span>유료 만료</span><strong>{formatKoreaDateTime(user.membershipExpiredAt)}</strong></div>
            </div>

            <div className="membership-form-grid">
              <div className="form-field">
                <label htmlFor="membership-type">변경할 회원 등급</label>
                <select
                  id="membership-type"
                  value={membershipType}
                  disabled={submitting}
                  onChange={handleMembershipTypeChange}
                >
                  <option value="FREE">무료회원</option>
                  <option value="PAID">유료회원</option>
                </select>
              </div>

              {membershipType === 'PAID' && (
                <>
                  <div className="form-field">
                    <label htmlFor="membership-started-at">유료 시작일시 (KST)</label>
                    <input
                      id="membership-started-at"
                      type="datetime-local"
                      required
                      value={startedAt}
                      disabled={submitting}
                      onChange={(event) => setStartedAt(event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="membership-expired-at">유료 만료일시 (KST)</label>
                    <input
                      id="membership-expired-at"
                      type="datetime-local"
                      required
                      value={expiredAt}
                      disabled={submitting}
                      onChange={(event) => setExpiredAt(event.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {membershipType === 'FREE' && user.membershipType === 'PAID' && (
              <div className="membership-warning">
                무료회원으로 변경하면 기존 유료 시작/만료 정보가 초기화됩니다.
              </div>
            )}
            {formError && <div className="submit-error" role="alert">{formError}</div>}
            {successMessage && <div className="submit-success" role="status">{successMessage}</div>}

            <div className="membership-form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting ? '변경 중...' : '회원 등급 변경'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

export default UserDetailPage;
