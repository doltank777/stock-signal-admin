import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUsers } from '../api/adminUserApi';
import { formatKoreaDateTime } from '../utils/dateTime';

const MEMBERSHIP_FILTERS = [
  ['ALL', '전체'],
  ['FREE', '무료회원'],
  ['PAID_SCHEDULED', '유료 예정'],
  ['PAID_ACTIVE', '유료 활성'],
  ['PAID_EXPIRED', '유료 만료'],
];

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

function UserManagementPage() {
  const navigate = useNavigate();
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [membership, setMembership] = useState('ALL');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setErrorMessage('');

      try {
        const data = await getAdminUsers(
          {
            membership,
            keyword: keyword || undefined,
            page,
            size: 20,
          },
          controller.signal
        );

        setResult(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(
            error.response?.data?.message ||
              '회원 목록을 불러오지 못했습니다.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => controller.abort();
  }, [keyword, membership, page]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(0);
    setKeyword(keywordInput.trim());
  }

  function handleMembershipChange(event) {
    setMembership(event.target.value);
    setPage(0);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>회원 관리</h1>
          <p>회원 등급과 서비스 이용 상태를 관리합니다.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate('/users/new')}
        >
          회원 등록
        </button>
      </div>

      <section className="content-card user-filter-card">
        <form className="user-filter-form" onSubmit={handleSearch}>
          <div className="form-field user-search-field">
            <label htmlFor="user-keyword">회원 검색</label>
            <input
              id="user-keyword"
              type="search"
              placeholder="이메일 또는 닉네임 검색"
              value={keywordInput}
              onChange={(event) =>
                setKeywordInput(event.target.value)
              }
            />
          </div>

          <div className="form-field user-membership-filter">
            <label htmlFor="membership-filter">회원 상태</label>
            <select
              id="membership-filter"
              value={membership}
              onChange={handleMembershipChange}
            >
              {MEMBERSHIP_FILTERS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="primary-button user-search-button"
          >
            검색
          </button>
        </form>
      </section>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h2>회원 목록</h2>
            <p>총 {result.totalElements}명</p>
          </div>
        </div>

        <div className="user-table">
          <div className="user-table-header" role="row">
            <div>ID</div>
            <div>이메일</div>
            <div>닉네임</div>
            <div>회원 상태</div>
            <div>Role</div>
            <div>푸시</div>
            <div>가입일</div>
            <div>관리</div>
          </div>

          {loading && (
            <div className="empty-table">회원 목록을 불러오는 중입니다.</div>
          )}

          {!loading && errorMessage && (
            <div className="table-error" role="alert">
              {errorMessage}
            </div>
          )}

          {!loading &&
            !errorMessage &&
            result.content.length === 0 && (
              <div className="empty-table">조건에 맞는 회원이 없습니다.</div>
            )}

          {!loading &&
            !errorMessage &&
            result.content.map((user) => (
              <div className="user-table-row" role="row" key={user.id}>
                <div>{user.id}</div>
                <div className="user-email">{user.email}</div>
                <div>{user.nickname}</div>
                <div>
                  <span
                    className={`membership-badge ${user.membershipStatus.toLowerCase()}`}
                  >
                    {MEMBERSHIP_LABELS[user.membershipStatus] ||
                      user.membershipStatus}
                  </span>
                </div>
                <div>{ROLE_LABELS[user.role] || user.role}</div>
                <div>{user.pushRegistered ? '등록' : '미등록'}</div>
                <div>{formatKoreaDateTime(user.createdAt, true)}</div>
                <div>
                  <button
                    type="button"
                    className="table-action-button"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    상세
                  </button>
                </div>
              </div>
            ))}
        </div>

        {!loading && !errorMessage && result.totalPages > 0 && (
          <div className="pagination">
            <button
              type="button"
              className="secondary-button"
              disabled={result.page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              이전
            </button>
            <span>
              {result.page + 1} / {result.totalPages}
            </span>
            <button
              type="button"
              className="secondary-button"
              disabled={result.page + 1 >= result.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              다음
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default UserManagementPage;
