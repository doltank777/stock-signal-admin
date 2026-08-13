import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createSearchCondition,
  getSearchConditionMetadata,
} from '../api/searchConditionApi';

let nextRuleId = 1;

const OPERATOR_SYMBOLS = {
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '>=',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '<=',
  EQUAL: '=',
};

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
  error,
  id,
  items,
  label,
  onChange,
  optionLabel,
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
            {optionLabel
              ? optionLabel(item)
              : item.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="field-error">{error}</span>
      )}
    </div>
  );
}

function RuleEditor({
  disabled,
  errors,
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
            error={errors.logicalOperator}
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
          error={errors.leftMetric}
          onChange={(value) =>
            updateField('leftMetric', value)
          }
        />

        {leftMetric?.periodRequired && (
          <div className="form-field">
            <label htmlFor={fieldId('left-period')}>
              기간
            </label>
            <div className="period-input">
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
              <span>일</span>
            </div>
            {errors.leftPeriod && (
              <span className="field-error">
                {errors.leftPeriod}
              </span>
            )}
          </div>
        )}

        <MetadataSelect
          id={fieldId('operator')}
          label="조건"
          placeholder="연산자 선택"
          items={metadata?.operators || []}
          value={rule.operator}
          disabled={disabled}
          error={errors.operator}
          optionLabel={(item) => {
            const symbol = OPERATOR_SYMBOLS[item.code];

            return symbol
              ? `${item.label} (${symbol})`
              : item.label;
          }}
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
          error={errors.rightType}
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
            {errors.rightValue && (
              <span className="field-error">
                {errors.rightValue}
              </span>
            )}
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
              error={errors.rightMetric}
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
                <div className="period-input">
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
                  <span>일</span>
                </div>
                {errors.rightPeriod && (
                  <span className="field-error">
                    {errors.rightPeriod}
                  </span>
                )}
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
  errors,
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
              errors={errors[rule.id] || {}}
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

function isIntegerInRange(value, min, max) {
  if (value === '') {
    return false;
  }

  const number = Number(value);

  return (
    Number.isInteger(number) &&
    number >= min &&
    number <= max
  );
}

function validateRule(rule, index, metadata) {
  const errors = {};
  const leftMetric = getMetric(
    metadata,
    rule.leftMetric
  );
  const rightMetric = getMetric(
    metadata,
    rule.rightMetric
  );

  if (!rule.leftMetric) {
    errors.leftMetric = '지표를 선택해 주세요.';
  }

  if (
    leftMetric?.periodRequired &&
    !isIntegerInRange(
      rule.leftPeriod,
      1,
      Number.MAX_SAFE_INTEGER
    )
  ) {
    errors.leftPeriod =
      '기간은 1 이상의 정수로 입력해 주세요.';
  }

  if (!rule.operator) {
    errors.operator = '연산자를 선택해 주세요.';
  }

  if (!rule.rightType) {
    errors.rightType = '비교 대상을 선택해 주세요.';
  }

  if (rule.rightType === 'VALUE') {
    if (
      rule.rightValue === '' ||
      !Number.isFinite(Number(rule.rightValue))
    ) {
      errors.rightValue =
        '비교 값을 숫자로 입력해 주세요.';
    }
  }

  if (rule.rightType === 'METRIC') {
    if (!rule.rightMetric) {
      errors.rightMetric =
        '비교 지표를 선택해 주세요.';
    }

    if (
      rightMetric?.periodRequired &&
      !isIntegerInRange(
        rule.rightPeriod,
        1,
        Number.MAX_SAFE_INTEGER
      )
    ) {
      errors.rightPeriod =
        '비교 기간은 1 이상의 정수로 입력해 주세요.';
    }
  }

  if (index > 0 && !rule.logicalOperator) {
    errors.logicalOperator =
      '조건 연결 방식을 선택해 주세요.';
  }

  return errors;
}

function buildRuleRequest(rule, index, metadata) {
  const leftMetric = getMetric(
    metadata,
    rule.leftMetric
  );
  const request = {
    stage: rule.stage,
    leftMetric: rule.leftMetric,
    leftPeriod: leftMetric.periodRequired
      ? Number(rule.leftPeriod)
      : null,
    operator: rule.operator,
    rightType: rule.rightType,
    rightValue: null,
    rightMetric: null,
    rightPeriod: null,
    logicalOperator:
      index === 0 ? null : rule.logicalOperator,
    ruleOrder: index + 1,
  };

  if (rule.rightType === 'VALUE') {
    request.rightValue = Number(rule.rightValue);
  }

  if (rule.rightType === 'METRIC') {
    const rightMetric = getMetric(
      metadata,
      rule.rightMetric
    );

    request.rightMetric = rule.rightMetric;
    request.rightPeriod = rightMetric.periodRequired
      ? Number(rule.rightPeriod)
      : null;
  }

  return request;
}

function SearchConditionCreatePage() {
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState('');
  const [form, setForm] = useState({
    name: '',
    priority: '0',
    screeningScore: '0',
    realtimeEnabled: false,
    enabled: true,
  });
  const [formErrors, setFormErrors] =
    useState({});
  const [screeningRuleErrors, setScreeningRuleErrors] =
    useState({});
  const [signalRuleErrors, setSignalRuleErrors] =
    useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] =
    useState(false);
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

  function updateForm(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function validateForm() {
    const nextFormErrors = {};
    const nextScreeningErrors = {};
    const nextSignalErrors = {};

    if (!form.name.trim()) {
      nextFormErrors.name =
        '검색식명을 입력해 주세요.';
    } else if (form.name.trim().length > 100) {
      nextFormErrors.name =
        '검색식명은 100자 이하로 입력해 주세요.';
    }

    if (!isIntegerInRange(form.priority, 0, 1000)) {
      nextFormErrors.priority =
        '우선순위는 0 이상 1000 이하의 정수로 입력해 주세요.';
    }

    if (
      !isIntegerInRange(form.screeningScore, 0, 100)
    ) {
      nextFormErrors.screeningScore =
        '후보 점수는 0 이상 100 이하의 정수로 입력해 주세요.';
    }

    if (screeningRules.length === 0) {
      nextFormErrors.screeningRules =
        'SCREENING 조건이 최소 1개 필요합니다.';
    }

    if (
      form.realtimeEnabled &&
      signalRules.length === 0
    ) {
      nextFormErrors.signalRules =
        '실시간 감시 검색식에는 SIGNAL 조건이 최소 1개 필요합니다.';
    }

    if (
      !form.realtimeEnabled &&
      signalRules.length > 0
    ) {
      nextFormErrors.signalRules =
        '실시간 감시를 사용하지 않으면 SIGNAL 조건을 등록할 수 없습니다.';
    }

    screeningRules.forEach((rule, index) => {
      const errors = validateRule(
        rule,
        index,
        metadata
      );

      if (Object.keys(errors).length > 0) {
        nextScreeningErrors[rule.id] = errors;
      }
    });

    signalRules.forEach((rule, index) => {
      const errors = validateRule(
        rule,
        index,
        metadata
      );

      if (Object.keys(errors).length > 0) {
        nextSignalErrors[rule.id] = errors;
      }
    });

    setFormErrors(nextFormErrors);
    setScreeningRuleErrors(nextScreeningErrors);
    setSignalRuleErrors(nextSignalErrors);

    return (
      Object.keys(nextFormErrors).length === 0 &&
      Object.keys(nextScreeningErrors).length === 0 &&
      Object.keys(nextSignalErrors).length === 0
    );
  }

  async function handleSubmit() {
    if (metadataUnavailable || submitting) {
      return;
    }

    setApiError('');

    if (!validateForm()) {
      return;
    }

    const request = {
      name: form.name.trim(),
      description: null,
      enabled: form.enabled,
      priority: Number(form.priority),
      screeningScore: Number(form.screeningScore),
      realtimeEnabled: form.realtimeEnabled,
      rules: [
        ...screeningRules.map((rule, index) =>
          buildRuleRequest(rule, index, metadata)
        ),
        ...signalRules.map((rule, index) =>
          buildRuleRequest(rule, index, metadata)
        ),
      ],
    };

    setSubmitting(true);

    try {
      await createSearchCondition(request);
      navigate('/search-conditions');
    } catch (error) {
      const backendMessage =
        error.response?.data?.message;

      setApiError(
        backendMessage ||
          '검색식 등록에 실패했습니다.'
      );
    } finally {
      setSubmitting(false);
    }
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
                  value={form.name}
                  onChange={(event) =>
                    updateForm('name', event.target.value)
                  }
                />
                {formErrors.name && (
                  <span className="field-error">
                    {formErrors.name}
                  </span>
                )}
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
                  value={form.priority}
                  onChange={(event) =>
                    updateForm(
                      'priority',
                      event.target.value
                    )
                  }
                />
                {formErrors.priority && (
                  <span className="field-error">
                    {formErrors.priority}
                  </span>
                )}
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
                  value={form.screeningScore}
                  onChange={(event) =>
                    updateForm(
                      'screeningScore',
                      event.target.value
                    )
                  }
                />
                {formErrors.screeningScore && (
                  <span className="field-error">
                    {formErrors.screeningScore}
                  </span>
                )}
              </div>
            </div>
            <div className="condition-toggle-row">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.realtimeEnabled}
                  onChange={(event) =>
                    updateForm(
                      'realtimeEnabled',
                      event.target.checked
                    )
                  }
                />
                <span>실시간 감시</span>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) =>
                    updateForm(
                      'enabled',
                      event.target.checked
                    )
                  }
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
          errors={screeningRuleErrors}
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

        {formErrors.screeningRules && (
          <div className="section-error">
            {formErrors.screeningRules}
          </div>
        )}

        <RuleSection
          stage="SIGNAL"
          description="WebSocket 실시간 데이터를 이용해 최종 Signal을 판단합니다."
          rules={signalRules}
          metadata={metadata}
          disabled={metadataUnavailable}
          errors={signalRuleErrors}
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
        {formErrors.signalRules && (
          <div className="section-error">
            {formErrors.signalRules}
          </div>
        )}
      </div>

      {apiError && (
        <div className="submit-error" role="alert">
          {apiError}
        </div>
      )}

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
          disabled={metadataUnavailable || submitting}
          onClick={handleSubmit}
        >
          {submitting ? '등록 중...' : '검색식 등록'}
        </button>
      </div>
    </div>
  );
}

export default SearchConditionCreatePage;
