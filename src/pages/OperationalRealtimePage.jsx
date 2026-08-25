import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getOperationalRealtimeStatus,
  retryOperationalRealtimeReconciliation,
} from '../api/operationalRealtimeApi';
import { formatKoreaDateTime } from '../utils/dateTime';

const REFRESH_INTERVAL_MS = 30 * 1000;

const MORNING_LABELS = {
  IDLE: '대기',
  PENDING_SCREENING: '스크리닝 준비 중',
  PENDING_RECONCILIATION: '실시간 적용 재시도 대기',
  COMPLETED: '완료',
  SKIPPED_NON_TRADING_DAY: '휴장일',
  FAILED_DEADLINE: '준비 마감 실패',
  FAILED_FATAL: '실행 실패',
};

const RECONCILIATION_LABELS = {
  NO_OP: '변경 없음',
  COMPLETED: '적용 완료',
  PARTIAL_FAILURE: '일부 적용 실패',
};

function labelOf(labels, value) {
  return value ? labels[value] || value : '-';
}

function toneOf(value) {
  if (value === 'COMPLETED' || value === 'NO_OP') return 'success';
  if (value?.startsWith('PENDING')) return 'progress';
  if (value?.startsWith('FAILED') || value === 'PARTIAL_FAILURE') return 'warning';
  return 'neutral';
}

function errorMessage(error, fallback) {
  if (error?.code === 'ERR_CANCELED') return '';
  return error?.response?.data?.message || fallback;
}

function formatDuration(value) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value || '');
  if (!match) return value || '-';
  const [, hours, minutes, seconds] = match;
  return [hours && `${hours}시간`, minutes && `${minutes}분`, seconds && `${seconds}초`]
    .filter(Boolean)
    .join(' ') || '-';
}

function StatusBadge({ value, labels = RECONCILIATION_LABELS }) {
  return (
    <span className={`operational-badge ${toneOf(value)}`}>
      {labelOf(labels, value)}
    </span>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="operational-key-value">
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
    </div>
  );
}

function CodeList({ title, values }) {
  if (!values?.length) return null;
  return (
    <div className="operational-diagnostic-item">
      <strong>{title}</strong>
      <div className="operational-code-list">
        {values.map((value) => <code key={value}>{value}</code>)}
      </div>
    </div>
  );
}

function OperationalRealtimePage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const requestRef = useRef(null);
  const hasStatusRef = useRef(false);

  const loadStatus = useCallback(async () => {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    if (!hasStatusRef.current) setLoading(true);
    setRefreshing(true);
    setError('');
    try {
      const result = await getOperationalRealtimeStatus(controller.signal);
      hasStatusRef.current = true;
      setStatus(result);
      setLastUpdatedAt(new Date());
    } catch (requestError) {
      const message = errorMessage(requestError, '운영 실시간 상태를 불러오지 못했습니다.');
      if (message) setError(message);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadStatus, 0);
    const intervalId = window.setInterval(loadStatus, REFRESH_INTERVAL_MS);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [loadStatus]);

  async function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    setActionMessage(null);
    try {
      const result = await retryOperationalRealtimeReconciliation();
      const messages = {
        EXECUTED: result.reconciliationStatus === 'PARTIAL_FAILURE'
          ? '재시도했지만 일부 종목 적용에 실패했습니다.'
          : '실시간 적용 재시도를 완료했습니다.',
        NO_PENDING_RECONCILIATION: '재시도할 실시간 적용 작업이 없습니다.',
        OUTSIDE_MONITORING_WINDOW: '현재는 수동 복구 가능 시간이 아닙니다.',
        ALREADY_RUNNING: '다른 운영 작업이 실행 중입니다.',
      };
      setActionMessage({
        tone: result.status === 'EXECUTED' && result.reconciliationStatus !== 'PARTIAL_FAILURE'
          ? 'success' : 'warning',
        text: messages[result.status] || result.status,
      });
      await loadStatus();
    } catch (requestError) {
      setActionMessage({
        tone: 'warning',
        text: errorMessage(requestError, '실시간 적용 재시도에 실패했습니다.'),
      });
    } finally {
      setRetrying(false);
    }
  }

  if (loading && !status) {
    return <div className="page-container"><div className="page-state">운영 상태를 불러오는 중...</div></div>;
  }

  if (!status) {
    return (
      <div className="page-container">
        <div className="page-state page-state-error">
          <span>{error || '운영 상태를 불러오지 못했습니다.'}</span>
          <button type="button" className="secondary-button" onClick={loadStatus}>다시 시도</button>
        </div>
      </div>
    );
  }

  const { session = {}, automation = {}, morning = {}, screening = {}, desired = {}, applied = {} } = status;
  const retryEnabled = morning.pendingReconciliation && session.startupRecoveryWindow && !retrying;
  const targets = desired.selectedTargets || [];

  return (
    <div className="page-container operational-page">
      <div className="page-header operational-page-header">
        <div>
          <h1>운영 실시간 감시</h1>
          <p>아침 자동 스크리닝부터 실시간 감시 선정 Top40과 실제 적용 상태까지 함께 확인합니다.</p>
          <span className="last-updated">
            최종 갱신: {lastUpdatedAt?.toLocaleTimeString('ko-KR') || '-'} · 30초마다 자동 갱신
          </span>
        </div>
        <div className="page-header-actions">
          <button type="button" className="secondary-button" disabled={refreshing} onClick={loadStatus}>
            {refreshing ? '새로고침 중...' : '새로고침'}
          </button>
          <button type="button" className="primary-button" disabled={!retryEnabled} onClick={handleRetry}
            title={!morning.pendingReconciliation ? '재시도할 실시간 적용 작업이 없습니다.' : !session.startupRecoveryWindow ? '현재는 수동 복구 가능 시간이 아닙니다.' : ''}>
            {retrying ? '재시도 중...' : '실시간 적용 재시도'}
          </button>
        </div>
      </div>

      {error && <div className="table-error" role="alert">{error}</div>}
      {actionMessage && <div className={`operational-notice ${actionMessage.tone}`} role="status">{actionMessage.text}</div>}

      <div className="operational-summary-grid">
        <div className="summary-card"><div className="summary-card-label">아침 스크리닝</div><div className="summary-card-status"><StatusBadge value={morning.status} labels={MORNING_LABELS} /></div><div className="summary-card-description">실행 시도 {morning.executionAttemptCount ?? 0}회</div></div>
        <div className="summary-card" title="최신 스크리닝에서 실시간 감시 대상으로 선정된 종목"><div className="summary-card-label">선정 목표</div><div className="summary-card-value">{desired.selectedCount ?? 0} / {desired.capacity ?? '-'}</div><div className="summary-card-description">최신 스크리닝으로 선정된 실시간 감시 대상</div></div>
        <div className="summary-card" title="KIS 실시간 연결에서 구독이 확인된 종목 수"><div className="summary-card-label">실제 구독</div><div className="summary-card-value">{applied.physicalCount ?? 0}</div><div className="summary-card-description">구독 확인 완료 종목 수</div></div>
        <div className="summary-card" title="실시간 조건 평가 대상으로 연결된 종목 수"><div className="summary-card-label">실시간 평가 연결</div><div className="summary-card-value">{applied.registryCount ?? 0}</div><div className="summary-card-description">조건 평가에 연결된 종목 수</div></div>
        <div className="summary-card"><div className="summary-card-label">선정 목표 적용 상태</div><div className={`summary-card-state ${applied.desiredApplied ? 'success' : 'warning'}`}>{applied.desiredApplied ? '적용 완료' : '미적용 / 불일치'}</div><div className="summary-card-description">최대 감시 가능 수 {applied.capacity ?? desired.capacity ?? '-'}종목</div></div>
      </div>

      <div className="operational-section-grid">
        <section className="content-card operational-detail-card">
          <div className="content-card-header"><div><h2>아침 스크리닝 및 시장 상태</h2><p>서버 기준 현재 시간과 실행 상태입니다.</p></div></div>
          <div className="operational-detail-body">
            <KeyValue label="현재 시간(KST)" value={formatKoreaDateTime(status.currentKst)} />
            <KeyValue label="아침 스크리닝 날짜" value={morning.date} />
            <KeyValue label="마지막 시도" value={formatKoreaDateTime(morning.lastAttemptAt)} />
            <KeyValue label="재적용 대기 종목 수" value={morning.pendingSelectedCount ?? 0} />
            <KeyValue label="아침 자동 실행 가능 시간" value={session.morningPreparationWindow ? '예' : '아니오'} />
            <KeyValue label="정규장 감시 시간" value={session.regularMonitoringWindow ? '예' : '아니오'} />
            <KeyValue label="아침 준비 마감 도달" value={session.deadlineReached ? '예' : '아니오'} />
            <KeyValue label="재시작 시 실시간 감시 복구 가능" value={session.startupRecoveryWindow ? '예' : '아니오'} />
          </div>
        </section>

        <section className="content-card operational-detail-card">
          <div className="content-card-header"><div><h2>자동 실행 설정</h2><p>자동 실행이 꺼져 있어도 오류를 의미하지 않습니다.</p></div></div>
          <div className="operational-detail-body">
            <KeyValue label="자동 실행" value={automation.morningEnabled ? '사용' : '사용 안 함'} />
            <KeyValue label="아침 스크리닝 시작" value={automation.morningStart} />
            <KeyValue label="아침 준비 마감" value={automation.morningDeadline} />
            <KeyValue label="재시도 간격" value={formatDuration(automation.retryInterval)} />
            <KeyValue label="정규장 운영 시간" value={`${automation.marketOpen || '-'} ~ ${automation.marketClose || '-'}`} />
          </div>
        </section>

        <section className="content-card operational-detail-card">
          <div className="content-card-header"><div><h2>마지막 성공 스크리닝</h2><p>현재 아침 스크리닝 실행 상태와 별도로 저장된 마지막 성공 결과입니다.</p></div></div>
          <div className="operational-detail-body">
            <KeyValue label="최근 결과 있음" value={screening.available ? '예' : '아니오'} />
            <KeyValue label="기준 거래일" value={screening.evaluationDate} />
            <KeyValue label="후보 수" value={screening.candidateCount ?? 0} />
            <KeyValue label="결과 최신 상태" value={screening.staleForCurrentDate ? '이전 결과' : '최신 결과'} />
          </div>
          {!screening.available && <div className="operational-inline-empty">아직 실행된 운영 스크리닝이 없습니다.</div>}
          {screening.staleForCurrentDate && <div className="operational-inline-warning">현재 날짜 기준 오래된 마지막 성공 스크리닝 결과입니다.</div>}
        </section>

        <section className="content-card operational-detail-card">
          <div className="content-card-header"><div><h2>선정 결과와 실제 감시 상태</h2><p>선정 목표, 실시간 평가 연결, 실제 구독 상태를 비교합니다.</p></div></div>
          <div className="operational-detail-body">
            <KeyValue label="실시간 감시 대상 후보" value={desired.uniqueCandidateCount ?? 0} />
            <KeyValue label="선정 종목 / 제외 종목" value={`${desired.selectedCount ?? 0} / ${desired.excludedCount ?? 0}`} />
            <KeyValue label="평가 연결 / 실제 구독" value={`${applied.registryCount ?? 0} / ${applied.physicalCount ?? 0}`} />
            <KeyValue label="실시간 평가와 실제 구독 일치" value={applied.registryPhysicalMismatch ? '불일치' : '정상'} />
            <KeyValue label="평가에 연결되지 않은 실제 구독" value={applied.unmappedPhysicalCount ?? 0} />
            <KeyValue label="이전 실시간 감시 정리 결과" value={labelOf(RECONCILIATION_LABELS, morning.staleClearStatus)} />
          </div>
        </section>
      </div>

      {(applied.registryPhysicalMismatch || applied.desiredNotInRegistry?.length || applied.registryNotDesired?.length || applied.unmappedPhysicalStockCodes?.length || morning.failureOperation) && (
        <section className="content-card operational-diagnostics">
          <div className="content-card-header"><div><h2>불일치 및 실패 진단</h2><p>현재 적용되지 않았거나 상태 간 일치하지 않는 항목입니다.</p></div></div>
          <div className="operational-diagnostics-body">
            {applied.registryPhysicalMismatch && <div className="operational-inline-warning">실제 구독 상태와 실시간 평가 연결이 일치하지 않습니다.</div>}
            <CodeList title="선정됐지만 실시간 평가에 연결되지 않은 종목" values={applied.desiredNotInRegistry} />
            <CodeList title="실시간 평가에 연결돼 있지만 최신 선정 목표에는 없는 종목" values={applied.registryNotDesired} />
            <CodeList title="실시간 평가에 연결되지 않은 실제 구독 종목" values={applied.unmappedPhysicalStockCodes} />
            {morning.failureOperation && <div className="operational-failure"><strong>최근 실패</strong><span>작업 {morning.failureOperation}</span><span>종목 {morning.failureStockCode || '-'}</span><span>{morning.failureMessage || '-'}</span></div>}
          </div>
        </section>
      )}

      <section className="content-card operational-targets">
        <div className="content-card-header"><div><h2>실시간 감시 선정 Top40</h2><p>최신 운영 스크리닝에서 선정된 실시간 감시 대상 순서입니다.</p></div></div>
        {!desired.available && <div className="empty-state">아직 생성된 실시간 감시 선정 결과가 없습니다.</div>}
        {desired.available && targets.length === 0 && <div className="empty-state">조건을 만족한 실시간 감시 대상이 없습니다.</div>}
        {targets.length > 0 && <div className="operational-table-wrap"><table className="operational-table"><thead><tr><th>순위</th><th>종목</th><th>시장</th><th>우선순위</th><th>후보 점수</th><th>매칭 검색식</th></tr></thead><tbody>{targets.map((target) => <tr key={target.stockCode}><td>{target.rank}</td><td><strong>{target.stockName}</strong><span>{target.stockCode}</span></td><td><span className="market-badge">{target.market}</span></td><td>{target.effectivePriority}</td><td>{target.effectiveScreeningScore}</td><td><div className="operational-condition-list">{(target.matchedConditions || []).map((condition) => <span key={condition.searchConditionId} title={`검색식 #${condition.searchConditionId} · 우선순위 ${condition.priority} · 점수 ${condition.screeningScore}`}>{condition.searchConditionName}</span>)}</div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default OperationalRealtimePage;
