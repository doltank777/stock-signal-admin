import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getRealtimeWatchTargets,
  getScreeningResults,
} from '../api/dashboardApi';

const REALTIME_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function getErrorMessage(error, fallback) {
  if (error?.code === 'ERR_CANCELED') return '';
  return error?.response?.data?.message || fallback;
}

function StockList({ stocks }) {
  return (
    <div className="dashboard-stock-list">
      {stocks.map((stock) => (
        <div className="dashboard-stock-row" key={stock.stockId}>
          <strong>{stock.stockName}</strong>
          <span>{stock.stockCode}</span>
          <span className="market-badge">{stock.market}</span>
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const [screening, setScreening] = useState(null);
  const [screeningLoading, setScreeningLoading] = useState(true);
  const [screeningError, setScreeningError] = useState('');
  const [realtime, setRealtime] = useState(null);
  const [realtimeLoading, setRealtimeLoading] = useState(true);
  const [realtimeError, setRealtimeError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const realtimeRequestRef = useRef(null);

  const loadRealtime = useCallback(async () => {
    if (realtimeRequestRef.current) return;

    const controller = new AbortController();
    realtimeRequestRef.current = controller;
    setRealtimeLoading(true);
    setRealtimeError('');
    try {
      const result = await getRealtimeWatchTargets(controller.signal);
      setRealtime(result);
      setLastUpdatedAt(new Date());
    } catch (error) {
      const message = getErrorMessage(
        error,
        '실시간 감시 현황을 불러오지 못했습니다.'
      );
      if (message) setRealtimeError(message);
    } finally {
      if (realtimeRequestRef.current === controller) {
        realtimeRequestRef.current = null;
        setRealtimeLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const screeningController = new AbortController();

    async function loadScreening() {
      try {
        const result = await getScreeningResults(screeningController.signal);
        setScreening(result);
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Screening 결과를 불러오지 못했습니다.'
        );
        if (message) setScreeningError(message);
      } finally {
        if (!screeningController.signal.aborted) setScreeningLoading(false);
      }
    }

    loadScreening();
    const initialRealtimeTimeoutId = window.setTimeout(loadRealtime, 0);
    const intervalId = window.setInterval(
      loadRealtime,
      REALTIME_REFRESH_INTERVAL_MS
    );

    return () => {
      screeningController.abort();
      window.clearTimeout(initialRealtimeTimeoutId);
      realtimeRequestRef.current?.abort();
      realtimeRequestRef.current = null;
      window.clearInterval(intervalId);
    };
  }, [loadRealtime]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>대시보드</h1>
          <p>Screening 선정 결과와 현재 실시간 감시 상태를 확인합니다.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="summary-card">
          <div className="summary-card-label">Screening 기준일</div>
          <div className="summary-card-value dashboard-date-value">
            {screening?.baseDate || '-'}
          </div>
          <div className="summary-card-description">최근 완료된 Screening</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">선정 검색식</div>
          <div className="summary-card-value">
            {screening?.conditions?.length ?? '-'}
          </div>
          <div className="summary-card-description">선정 종목이 있는 검색식</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">현재 실시간 감시</div>
          <div className="summary-card-value">
            {realtime ? `${realtime.count} / ${realtime.capacity}` : '-'}
          </div>
          <div className="summary-card-description">Registry 기준 감시 종목</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <section className="content-card">
          <div className="content-card-header">
            <div>
              <h2>검색식별 Screening 선정 종목</h2>
              <p>최근 성공적으로 완료된 Screening 결과입니다.</p>
            </div>
          </div>
          {screeningLoading && <div className="empty-state">불러오는 중...</div>}
          {!screeningLoading && screeningError && (
            <div className="table-error" role="alert">{screeningError}</div>
          )}
          {!screeningLoading && !screeningError && !screening?.available && (
            <div className="empty-state">아직 Screening 결과가 없습니다.</div>
          )}
          {!screeningLoading && !screeningError && screening?.available &&
            screening.conditions.length === 0 && (
              <div className="empty-state">선정된 종목이 없습니다.</div>
            )}
          {!screeningLoading && !screeningError &&
            screening?.conditions?.length > 0 && (
              <div className="screening-condition-grid">
                {screening.conditions.map((condition) => (
                  <article className="screening-condition-card" key={condition.searchConditionId}>
                    <div className="screening-condition-header">
                      <div>
                        <h3>{condition.searchConditionName}</h3>
                        <span>검색식 #{condition.searchConditionId}</span>
                      </div>
                      <div className="condition-count">선정 {condition.stockCount}종목</div>
                    </div>
                    <div className="condition-meta">
                      <span>우선순위 {condition.priority}</span>
                      <span>{condition.realtimeEnabled ? '실시간 감시 사용' : '실시간 감시 미사용'}</span>
                    </div>
                    <StockList stocks={condition.stocks} />
                  </article>
                ))}
              </div>
            )}
        </section>

        <section className="content-card">
          <div className="content-card-header dashboard-watch-header">
            <div>
              <h2>현재 실시간 감시 중</h2>
              <p>
                {realtime
                  ? `현재 ${realtime.count} / 최대 ${realtime.capacity}종목`
                  : 'RealtimeWatchTargetRegistry 조회 결과입니다.'}
              </p>
              {lastUpdatedAt && (
                <span className="last-updated">
                  화면 마지막 갱신: {lastUpdatedAt.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
            <button
              type="button"
              className="secondary-button dashboard-refresh-button"
              disabled={realtimeLoading}
              onClick={loadRealtime}
            >
              {realtimeLoading ? '새로고침 중' : '새로고침'}
            </button>
          </div>
          {realtimeLoading && !realtime && <div className="empty-state">불러오는 중...</div>}
          {realtimeError && <div className="table-error" role="alert">{realtimeError}</div>}
          {!realtimeLoading && !realtimeError && realtime?.stocks.length === 0 && (
            <div className="empty-state">현재 실시간 감시 중인 종목이 없습니다.</div>
          )}
          {realtime?.stocks.length > 0 && <StockList stocks={realtime.stocks} />}
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
