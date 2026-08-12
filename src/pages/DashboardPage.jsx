function DashboardPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>대시보드</h1>
          <p>Stock Signal 서비스 운영 현황을 관리합니다.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="summary-card">
          <div className="summary-card-label">
            등록 검색식
          </div>

          <div className="summary-card-value">
            -
          </div>

          <div className="summary-card-description">
            관리자 등록 검색식
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">
            활성 검색식
          </div>

          <div className="summary-card-value">
            -
          </div>

          <div className="summary-card-description">
            현재 활성 상태 검색식
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">
            실시간 감시
          </div>

          <div className="summary-card-value">
            -
          </div>

          <div className="summary-card-description">
            WebSocket 감시 검색식
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">
            WebSocket 후보
          </div>

          <div className="summary-card-value">
            0 / 40
          </div>

          <div className="summary-card-description">
            향후 실시간 후보 종목
          </div>
        </div>
      </div>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h2>서비스 상태</h2>
            <p>
              Backend API 연동은 다음 단계에서 적용합니다.
            </p>
          </div>
        </div>

        <div className="empty-state">
          관리자 웹 기본 레이아웃이 정상적으로 구성되었습니다.
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;