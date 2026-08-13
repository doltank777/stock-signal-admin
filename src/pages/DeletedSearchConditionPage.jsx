import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDeletedSearchConditions,
  restoreSearchCondition,
} from '../api/searchConditionApi';

function formatDeletedAt(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DeletedSearchConditionPage() {
  const navigate = useNavigate();
  const [searchConditions, setSearchConditions] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [pendingIds, setPendingIds] =
    useState(() => new Set());
  const pendingIdsRef = useRef(new Set());

  useEffect(() => {
    const controller = new AbortController();

    async function loadDeletedSearchConditions() {
      try {
        const conditions = await getDeletedSearchConditions(
          controller.signal
        );

        setSearchConditions(conditions);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(
          error.response?.data?.message ||
            '삭제된 검색식 목록을 불러오지 못했습니다.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDeletedSearchConditions();

    return () => controller.abort();
  }, []);

  async function handleRestore(condition) {
    if (pendingIdsRef.current.has(condition.id)) {
      return;
    }

    const confirmed = window.confirm(
      `"${condition.name}" 검색식을 복구하시겠습니까?\n\n복구 후 비활성 상태로 일반 목록에 돌아갑니다.`
    );

    if (!confirmed) {
      return;
    }

    pendingIdsRef.current.add(condition.id);
    setPendingIds(
      (currentIds) => new Set(currentIds).add(condition.id)
    );
    setRestoreError('');

    try {
      await restoreSearchCondition(condition.id);

      setSearchConditions((currentConditions) =>
        currentConditions.filter(
          (currentCondition) =>
            currentCondition.id !== condition.id
        )
      );
    } catch (error) {
      setRestoreError(
        error.response?.data?.message ||
          '검색식을 복구하지 못했습니다.'
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
          <h1>삭제된 검색식</h1>
          <p>삭제된 검색식을 확인하고 복구합니다.</p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate('/search-conditions')}
        >
          검색식 목록으로 돌아가기
        </button>
      </div>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h2>검색식 휴지통</h2>
          </div>
        </div>

        <div className="search-condition-table deleted-condition-table">
          {restoreError && (
            <div className="table-error" role="alert">
              {restoreError}
            </div>
          )}

          <div className="table-header">
            <div>검색식명</div>
            <div>우선순위</div>
            <div>후보 점수</div>
            <div>삭제 일시</div>
            <div>삭제자</div>
            <div>관리</div>
          </div>

          {loading && (
            <div className="empty-table">
              삭제된 검색식 목록을 불러오는 중입니다.
            </div>
          )}

          {!loading && errorMessage && (
            <div className="table-error" role="alert">
              {errorMessage}
            </div>
          )}

          {!loading &&
            !errorMessage &&
            searchConditions.length === 0 && (
              <div className="empty-table">
                삭제된 검색식이 없습니다.
              </div>
            )}

          {!loading &&
            !errorMessage &&
            searchConditions.map((condition) => (
              <div className="table-row" key={condition.id}>
                <div className="condition-name">
                  {condition.name}
                </div>
                <div>{condition.priority}</div>
                <div>{condition.screeningScore}</div>
                <div>{formatDeletedAt(condition.deletedAt)}</div>
                <div className="condition-deleted-by">
                  {condition.deletedByEmail ||
                    condition.deletedById ||
                    '-'}
                </div>
                <div>
                  <button
                    type="button"
                    className="table-action-button"
                    disabled={pendingIds.has(condition.id)}
                    onClick={() => handleRestore(condition)}
                  >
                    복구
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

export default DeletedSearchConditionPage;
