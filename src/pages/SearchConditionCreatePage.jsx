import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSearchConditionMetadata } from '../api/searchConditionApi';

let nextRuleId = 1;

function createRule(stage, ruleOrder) {
  return {
    id: nextRuleId++,
    stage,
    leftMetric: '',
    leftPeriod: '',
    operator: '',
    rightType: '',
    rightValue: '',
    rightMetric: '',
    rightPeriod: '',
    logicalOperator: '',
    ruleOrder,
  };
}

function getMetric(metadata, code) {
  return metadata?.metrics.find(
    (metric) => metric.code === code
  );
}

function MetadataSelect({
  disabled,
  id,
  items,
  label,
  onChange,
  placeholder,
  value,
}) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        <option value="">{placeholder}</option>
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

function RuleEditor({
  disabled,
  index,
  metadata,
  onChange,
  onRemove,
  rule,
}) {
  const leftMetric = getMetric(
    metadata,
    rule.leftMetric
  );
  const rightMetric = getMetric(
    metadata,
    rule.rightMetric
  );
  const fieldId = (field) =>
    `${rule.stage}-${rule.id}-${field}`;

  function updateField(field, value) {
    const changes = { [field]: value };

    if (field === 'leftMetric') {
      const selectedMetric = getMetric(
        metadata,
        value
      );

      if (!selectedMetric?.periodRequired) {
        changes.leftPeriod = '';
      }
    }

    if (field === 'rightType') {
      if (value === 'VALUE') {
        changes.rightMetric = '';
        changes.rightPeriod = '';
      } else if (value === 'METRIC') {
        changes.rightValue = '';
      } else {
        changes.rightValue = '';
        changes.rightMetric = '';
        changes.rightPeriod = '';
      }
    }

    if (field === 'rightMetric') {
      const selectedMetric = getMetric(
        metadata,
        value
      );

      if (!selectedMetric?.periodRequired) {
        changes.rightPeriod = '';
      }
    }

    onChange(rule.id, changes);
  }

  return (
    <div className="rule-editor">
      {index > 0 && (
        <div className="logical-connector">
          <MetadataSelect
            id={fieldId('logical-operator')}
            label="조건 연결"
            placeholder="AND / OR 선택"
            items={metadata?.logicalOperators || []}
            value={rule.logicalOperator}
            disabled={disabled}
            onChange={(value) =>
              updateField(
                'logicalOperator',
                value
              )
            }
          />
        </div>
      )}

      <div className="rule-editor-header">
        <strong>조건 {index + 1}</strong>
        <button
          type="button"
          className="rule-delete-button"
          disabled={disabled}
          onClick={() => onRemove(rule.id)}
        >
          삭제
        </button>
      </div>

      <div className="rule-field-grid">
        <MetadataSelect
          id={fieldId('left-metric')}
          label="지표"
          placeholder="지표 선택"
          items={metadata?.metrics || []}
          value={rule.leftMetric}
          disabled={disabled}
          onChange={(value) =>
            updateField('leftMetric', value)
          }
        />

        {leftMetric?.periodRequired && (
          <div className="form-field">
            <label htmlFor={fieldId('left-period')}>
              기간
            </label>
            <input
              id={fieldId('left-period')}
              type="number"
              min="1"
              value={rule.leftPeriod}
              disabled={disabled}
              onChange={(event) =>
                updateField(
                  'leftPeriod',
                  event.target.value
                )
              }
            />
          </div>
        )}

        <MetadataSelect
          id={fieldId('operator')}
          label="조건"
          placeholder="연산자 선택"
          items={metadata?.operators || []}
          value={rule.operator}
          disabled={disabled}
          onChange={(value) =>
            updateField('operator', value)
          }
        />

        <MetadataSelect
          id={fieldId('right-type')}
          label="비교 대상"
          placeholder="비교 대상 선택"
          items={metadata?.rightTypes || []}
          value={rule.rightType}
          disabled={disabled}
          onChange={(value) =>
            updateField('rightType', value)
          }
        />

        {rule.rightType === 'VALUE' && (
          <div className="form-field">
            <label htmlFor={fieldId('right-value')}>
              비교 값
            </label>
            <input
              id={fieldId('right-value')}
              type="number"
              step="any"
              value={rule.rightValue}
              disabled={disabled}
              onChange={(event) =>
                updateField(
                  'rightValue',
                  event.target.value
                )
              }
            />
          </div>
        )}

        {rule.rightType === 'METRIC' && (
          <>
            <MetadataSelect
              id={fieldId('right-metric')}
              label="비교 지표"
              placeholder="비교 지표 선택"
              items={metadata?.metrics || []}
              value={rule.rightMetric}
              disabled={disabled}
              onChange={(value) =>
                updateField('rightMetric', value)
              }
            />

            {rightMetric?.periodRequired && (
              <div className="form-field">
                <label
                  htmlFor={fieldId('right-period')}
                >
                  비교 기간
                </label>
                <input
                  id={fieldId('right-period')}
                  type="number"
                  min="1"
                  value={rule.rightPeriod}
                  disabled={disabled}
                  onChange={(event) =>
                    updateField(
                      'rightPeriod',
                      event.target.value
                    )
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RuleSection({
  description,
  disabled,
  metadata,
  onAdd,
  onChange,
  onRemove,
  rules,
  stage,
}) {
  return (
    <section className="content-card">
      <div className="content-card-header">
        <div>
          <h2>{stage} 조건</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="condition-form-body">
        <div className="rule-list">
          {rules.map((rule, index) => (
            <RuleEditor
              key={rule.id}
              rule={rule}
              index={index}
              metadata={metadata}
              disabled={disabled}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </div>

        <button
          type="button"
          className="add-rule-button"
          disabled={disabled}
          onClick={onAdd}
        >
          + {stage} 조건 추가
        </button>
      </div>
    </section>
  );
}

function normalizeRules(rules) {
  return rules.map((rule, index) => ({
    ...rule,
    logicalOperator:
      index === 0 ? '' : rule.logicalOperator,
    ruleOrder: index + 1,
  }));
}

function SearchConditionCreatePage() {
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState('');
  const [screeningRules, setScreeningRules] =
    useState(() => [createRule('SCREENING', 1)]);
  const [signalRules, setSignalRules] =
    useState(() => [createRule('SIGNAL', 1)]);

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

  function updateRules(setRules, ruleId, changes) {
    setRules((currentRules) =>
      currentRules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, ...changes }
          : rule
      )
    );
  }

  function addRule(setRules, stage) {
    setRules((currentRules) => [
      ...currentRules,
      createRule(stage, currentRules.length + 1),
    ]);
  }

  function removeRule(setRules, ruleId) {
    setRules((currentRules) =>
      normalizeRules(
        currentRules.filter(
          (rule) => rule.id !== ruleId
        )
      )
    );
  }

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

        <RuleSection
          stage="SCREENING"
          description="전체 종목에서 실시간 감시 후보를 선정합니다."
          rules={screeningRules}
          metadata={metadata}
          disabled={metadataUnavailable}
          onAdd={() =>
            addRule(setScreeningRules, 'SCREENING')
          }
          onChange={(ruleId, changes) =>
            updateRules(
              setScreeningRules,
              ruleId,
              changes
            )
          }
          onRemove={(ruleId) =>
            removeRule(setScreeningRules, ruleId)
          }
        />

        <RuleSection
          stage="SIGNAL"
          description="WebSocket 실시간 데이터를 이용해 최종 Signal을 판단합니다."
          rules={signalRules}
          metadata={metadata}
          disabled={metadataUnavailable}
          onAdd={() =>
            addRule(setSignalRules, 'SIGNAL')
          }
          onChange={(ruleId, changes) =>
            updateRules(
              setSignalRules,
              ruleId,
              changes
            )
          }
          onRemove={(ruleId) =>
            removeRule(setSignalRules, ruleId)
          }
        />
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
