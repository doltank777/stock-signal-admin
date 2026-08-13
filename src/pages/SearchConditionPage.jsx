import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSearchConditions } from '../api/searchConditionApi';

function SearchConditionPage() {
  const navigate = useNavigate();
  const [searchConditions, setSearchConditions] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadSearchConditions() {
      try {
        const conditions = await getSearchConditions(
          controller.signal
        );

        setSearchConditions(conditions);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const backendMessage =
          error.response?.data?.message;

        setErrorMessage(
          backendMessage ||
            '검색식 목록을 불러오지 못했습니다.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSearchConditions();

    return () => controller.abort();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>검색식 관리</h1>
          <p>
            종목 Screening 및 Signal 검색식을 관리합니다.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate('/search-conditions/new')
          }
        >
          + 검색식 등록
        </button>
      </div>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h2>등록 검색식</h2>
          </div>
        </div>

        <div className="search-condition-table">
          <div className="table-header">
            <div>검색식명</div>
            <div>우선순위</div>
            <div>후보 점수</div>
            <div>실시간 감시</div>
            <div>상태</div>
            <div>관리</div>
          </div>

          {loading && (
            <div className="empty-table">
              검색식 목록을 불러오는 중입니다.
            </div>
          )}

          {!loading && errorMessage && (
            <div
              className="table-error"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {!loading &&
            !errorMessage &&
            searchConditions.length === 0 && (
              <div className="empty-table">
                등록된 검색식이 없습니다.
              </div>
            )}

          {!loading &&
            !errorMessage &&
            searchConditions.map((condition) => (
              <div
                className="table-row"
                key={condition.id}
              >
                <div className="condition-name">
                  {condition.name}
                </div>
                <div>{condition.priority}</div>
                <div>{condition.screeningScore}</div>
                <div>
                  {condition.realtimeEnabled
                    ? '사용'
                    : '미사용'}
                </div>
                <div>
                  <span
                    className={`status-badge ${
                      condition.enabled
                        ? 'active'
                        : 'inactive'
                    }`}
                  >
                    {condition.enabled
                      ? '활성'
                      : '비활성'}
                  </span>
                </div>
                <div>
                  <button
                    type="button"
                    className="table-action-button"
                    onClick={() =>
                      navigate(
                        `/search-conditions/${condition.id}/edit`
                      )
                    }
                  >
                    수정
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

export default SearchConditionPage;
