function SearchConditionPage() {
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
        >
          + 검색식 등록
        </button>
      </div>

      <section className="content-card">
        <div className="content-card-header">
          <div>
            <h2>등록 검색식</h2>
            <p>
              등록된 검색식 목록이 이곳에 표시됩니다.
            </p>
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

          <div className="empty-table">
            아직 API를 연결하지 않았습니다.
          </div>
        </div>
      </section>
    </div>
  );
}

export default SearchConditionPage;