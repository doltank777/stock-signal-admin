import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  changeSearchConditionEnabled,
  deleteSearchCondition,
  getSearchConditions,
} from '../api/searchConditionApi';

function SearchConditionPage() {
  const navigate = useNavigate();
  const [searchConditions, setSearchConditions] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState('');
  const [statusError, setStatusError] =
    useState('');
  const [pendingIds, setPendingIds] =
    useState(() => new Set());
  const pendingIdsRef = useRef(new Set());

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

  async function handleEnabledChange(condition) {
    if (pendingIdsRef.current.has(condition.id)) {
      return;
    }

    pendingIdsRef.current.add(condition.id);
    setPendingIds(
      (currentIds) =>
        new Set(currentIds).add(condition.id)
    );
    setStatusError('');

    try {
      const updatedCondition =
        await changeSearchConditionEnabled(
          condition.id,
          !condition.enabled
        );

      setSearchConditions((currentConditions) =>
        currentConditions.map((currentCondition) =>
          currentCondition.id === updatedCondition.id
            ? updatedCondition
            : currentCondition
        )
      );
    } catch (error) {
      const backendMessage =
        error.response?.data?.message;

      setStatusError(
        backendMessage ||
          '검색식 상태를 변경하지 못했습니다.'
      );
    } finally {
      pendingIdsRef.current.delete(condition.id);
      setPendingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(condition.id);
        return nextIds;
      });
    }
  }

  async function handleDelete(condition) {
    if (pendingIdsRef.current.has(condition.id)) {
      return;
    }

    const confirmed = window.confirm(
      `"${condition.name}" 검색식을 삭제하시겠습니까?\n\n삭제된 검색식은 일반 목록에서 제거됩니다.`
    );

    if (!confirmed) {
      return;
    }

    pendingIdsRef.current.add(condition.id);
    setPendingIds(
      (currentIds) =>
        new Set(currentIds).add(condition.id)
    );
    setStatusError('');

    try {
      await deleteSearchCondition(condition.id);

      setSearchConditions((currentConditions) =>
        currentConditions.filter(
          (currentCondition) =>
            currentCondition.id !== condition.id
        )
      );
    } catch (error) {
      const backendMessage =
        error.response?.data?.message;

      setStatusError(
        backendMessage ||
          '검색식을 삭제하지 못했습니다.'
      );
    } finally {
      pendingIdsRef.current.delete(condition.id);
      setPendingIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(condition.id);
        return nextIds;
      });
    }
  }

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
          {statusError && (
            <div
              className="table-error"
              role="alert"
            >
              {statusError}
            </div>
          )}

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
                  <button
                    type="button"
                    role="switch"
                    aria-checked={condition.enabled}
                    aria-label={`${condition.name} ${
                      condition.enabled
                        ? '비활성화'
                        : '활성화'
                    }`}
                    className={`status-toggle ${
                      condition.enabled ? 'active' : ''
                    }`}
                    disabled={pendingIds.has(condition.id)}
                    onClick={() =>
                      handleEnabledChange(condition)
                    }
                  >
                    <span
                      className="status-toggle-track"
                      aria-hidden="true"
                    >
                      <span className="status-toggle-knob" />
                    </span>
                    <span className="status-toggle-label">
                      {condition.enabled
                        ? '활성'
                        : '비활성'}
                    </span>
                  </button>
                </div>
                <div className="table-actions">
                  <button
                    type="button"
                    className="table-action-button"
                    disabled={pendingIds.has(condition.id)}
                    onClick={() =>
                      navigate(
                        `/search-conditions/${condition.id}/edit`
                      )
                    }
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="table-action-button danger"
                    disabled={pendingIds.has(condition.id)}
                    onClick={() => handleDelete(condition)}
                  >
                    삭제
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
