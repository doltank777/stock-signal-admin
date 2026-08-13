import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSearchConditionMetadata } from '../api/searchConditionApi';

function MetadataSelect({
  disabled,
  id,
  items,
  label,
  placeholder,
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        defaultValue=""
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {items.map((item) => (
          <option
            key={item.code}
            value={item.code}
          >
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RuleMetadataFields({
  disabled,
  metadata,
  prefix,
}) {
  return (
    <div className="condition-field-grid">
      <MetadataSelect
        id={`${prefix}-metric`}
        label="지표"
        placeholder="지표 선택"
        items={metadata?.metrics || []}
        disabled={disabled}
      />
      <MetadataSelect
        id={`${prefix}-operator`}
        label="연산자"
        placeholder="연산자 선택"
        items={metadata?.operators || []}
        disabled={disabled}
      />
      <MetadataSelect
        id={`${prefix}-right-type`}
        label="비교 대상"
        placeholder="비교 대상 선택"
        items={metadata?.rightTypes || []}
        disabled={disabled}
      />
    </div>
  );
}

function SearchConditionCreatePage() {
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetadata() {
      try {
        const response =
          await getSearchConditionMetadata(
            controller.signal
          );

        setMetadata(response);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const backendMessage =
          error.response?.data?.message;

        setErrorMessage(
          backendMessage ||
            '검색식 설정 정보를 불러오지 못했습니다.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadMetadata();

    return () => controller.abort();
  }, []);

  const metadataUnavailable =
    loading || Boolean(errorMessage);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>검색식 등록</h1>
          <p>
            새로운 종목 검색 조건을 설정합니다.
          </p>
        </div>
      </div>

      <div className="condition-form-sections">
        <section className="content-card">
          <div className="content-card-header">
            <h2>기본 정보</h2>
          </div>
          <div className="condition-form-body">
            <div className="basic-info-grid">
              <div className="form-field name-field">
                <label htmlFor="condition-name">
                  검색식명
                </label>
                <input
                  id="condition-name"
                  type="text"
                  maxLength="100"
                  placeholder="검색식명을 입력하세요"
                />
              </div>
              <div className="form-field">
                <label htmlFor="priority">
                  우선순위
                </label>
                <input
                  id="priority"
                  type="number"
                  min="0"
                  max="1000"
                  defaultValue="0"
                />
              </div>
              <div className="form-field">
                <label htmlFor="screening-score">
                  후보 점수
                </label>
                <input
                  id="screening-score"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="0"
                />
              </div>
            </div>
            <div className="condition-toggle-row">
              <label className="checkbox-field">
                <input type="checkbox" />
                <span>실시간 감시</span>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  defaultChecked
                />
                <span>활성 상태</span>
              </label>
            </div>
          </div>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <div>
              <h2>SCREENING 조건</h2>
              <p>
                전체 종목에서 실시간 감시 후보를 선정합니다.
              </p>
            </div>
          </div>
          <div className="condition-form-body">
            {loading && (
              <div className="metadata-message">
                조건 설정 정보를 불러오는 중입니다.
              </div>
            )}
            {!loading && errorMessage && (
              <div
                className="metadata-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}
            <RuleMetadataFields
              prefix="screening"
              metadata={metadata}
              disabled={metadataUnavailable}
            />
          </div>
        </section>

        <section className="content-card">
          <div className="content-card-header">
            <div>
              <h2>SIGNAL 조건</h2>
              <p>
                WebSocket 실시간 데이터를 이용해 최종 Signal을 판단합니다.
              </p>
            </div>
          </div>
          <div className="condition-form-body">
            <RuleMetadataFields
              prefix="signal"
              metadata={metadata}
              disabled={metadataUnavailable}
            />
          </div>
        </section>
      </div>

      <div className="condition-form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate('/search-conditions')
          }
        >
          취소
        </button>
        <button
          type="button"
          className="primary-button"
          disabled
        >
          검색식 등록
        </button>
      </div>
    </div>
  );
}

export default SearchConditionCreatePage;
