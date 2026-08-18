const KOREA_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;

const KOREA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat(
  'ko-KR',
  {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }
);

export function formatKoreaDateTime(value, localDateTime = false) {
  if (!value) {
    return '-';
  }

  const normalizedValue =
    localDateTime && !hasTimeZone(value)
      ? `${value}+09:00`
      : value;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return KOREA_DATE_TIME_FORMATTER.format(date);
}

export function instantToKoreaDateTimeLocal(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Date(date.getTime() + KOREA_OFFSET_MILLISECONDS)
    .toISOString()
    .slice(0, 16);
}

export function koreaDateTimeLocalToInstant(value) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const utcMilliseconds =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ) - KOREA_OFFSET_MILLISECONDS;

  return new Date(utcMilliseconds).toISOString();
}

function hasTimeZone(value) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
}
