document.addEventListener('DOMContentLoaded', function () {
  const dropdown = document.querySelector('[data-dropdown="time_to_call"]');
  if (!dropdown) return;

  const items = Array.from(dropdown.querySelectorAll('.w-dyn-item'));
  if (!items.length) return;

  const hiddenLabel = document.getElementById('time-to-call-label');
  const hiddenValue = document.getElementById('time-to-call-value');
  const hiddenStart = document.getElementById('time-to-call-start');
  const hiddenEnd = document.getElementById('time-to-call-end');
  const hiddenTimezone = document.getElementById('time-to-call-timezone');

  const PARIS_TIMEZONE = 'Europe/Paris';

  function getParisNowParts() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: PARIS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(now);
    const map = {};

    parts.forEach((part) => {
      if (part.type !== 'literal') map[part.type] = part.value;
    });

    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(map.hour),
      minute: Number(map.minute),
      second: Number(map.second),
      weekdayShort: map.weekday
    };
  }

  function getParisWeekdayIndex(weekdayShort) {
    const map = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6
    };
    return map[weekdayShort];
  }

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function getIsoDate(year, month, day) {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function addDaysToDateParts(year, month, day, daysToAdd) {
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    utcDate.setUTCDate(utcDate.getUTCDate() + daysToAdd);

    return {
      year: utcDate.getUTCFullYear(),
      month: utcDate.getUTCMonth() + 1,
      day: utcDate.getUTCDate()
    };
  }

  function getAllowedDayGroups(weekdayIndex) {
    // 0 = Sun, 1 = Mon, ... 6 = Sat
    if (weekdayIndex >= 1 && weekdayIndex <= 4) {
      return ['asap', 'today', 'tomorrow'];
    }

    if (weekdayIndex === 5) {
      return ['asap', 'today', 'monday'];
    }

    return ['asap', 'monday', 'tuesday'];
  }

  function getTargetDateForDayGroup(dayGroup, parisNow) {
    const weekdayIndex = getParisWeekdayIndex(parisNow.weekdayShort);

    if (dayGroup === 'today') {
      return {
        year: parisNow.year,
        month: parisNow.month,
        day: parisNow.day
      };
    }

    if (dayGroup === 'tomorrow') {
      return addDaysToDateParts(parisNow.year, parisNow.month, parisNow.day, 1);
    }

    if (dayGroup === 'monday') {
      const daysUntilMonday = weekdayIndex === 0 ? 1 : (8 - weekdayIndex) % 7;
      return addDaysToDateParts(parisNow.year, parisNow.month, parisNow.day, daysUntilMonday);
    }

    if (dayGroup === 'tuesday') {
      let daysUntilTuesday = (2 - weekdayIndex + 7) % 7;
      if (daysUntilTuesday === 0) daysUntilTuesday = 7;
      return addDaysToDateParts(parisNow.year, parisNow.month, parisNow.day, daysUntilTuesday);
    }

    return null;
  }

  function buildLocalDateTime(dateParts, timeString) {
    if (!dateParts || !timeString) return '';
    return `${getIsoDate(dateParts.year, dateParts.month, dateParts.day)}T${timeString}:00`;
  }

  function timeStringToMinutes(timeString) {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function getCurrentParisMinutes(parisNow) {
    return parisNow.hour * 60 + parisNow.minute;
  }

  function setHiddenFields(label, value, start, end) {
    if (hiddenLabel) hiddenLabel.value = label || '';
    if (hiddenValue) hiddenValue.value = value || '';
    if (hiddenStart) hiddenStart.value = start || '';
    if (hiddenEnd) hiddenEnd.value = end || '';
    if (hiddenTimezone) hiddenTimezone.value = PARIS_TIMEZONE;
  }

  function applyFiltering() {
    const parisNow = getParisNowParts();
    const weekdayIndex = getParisWeekdayIndex(parisNow.weekdayShort);
    const allowedGroups = getAllowedDayGroups(weekdayIndex);
    const currentParisMinutes = getCurrentParisMinutes(parisNow);

    items.forEach((item) => {
      const dayGroup = item.dataset.dayGroup || '';
      const start = item.dataset.start || '';
      const end = item.dataset.end || '';

      let shouldShow = allowedGroups.includes(dayGroup);

      // Hide expired "today" slots once the slot END time has passed.
      if (shouldShow && dayGroup === 'today' && end) {
        const slotEndMinutes = timeStringToMinutes(end);
        if (slotEndMinutes !== null && slotEndMinutes <= currentParisMinutes) {
          shouldShow = false;
        }
      }

      if (shouldShow) {
        const targetDate = getTargetDateForDayGroup(dayGroup, parisNow);

        if (dayGroup === 'asap') {
          item.dataset.isoStart = '';
          item.dataset.isoEnd = '';
        } else {
          item.dataset.isoStart = buildLocalDateTime(targetDate, start);
          item.dataset.isoEnd = buildLocalDateTime(targetDate, end);
        }

        item.hidden = false;
        item.style.display = '';
      } else {
        item.dataset.isoStart = '';
        item.dataset.isoEnd = '';
        item.hidden = true;
        item.style.display = 'none';
      }
    });
  }

  function setDefaultHiddenValues() {
    const asapItem = items.find(
      (item) => !item.hidden && item.dataset.value === 'asap'
    );

    if (!asapItem) return;

    setHiddenFields(
      asapItem.dataset.label || 'Appelez-moi dès que possible',
      asapItem.dataset.value || 'asap',
      '',
      ''
    );
  }

  function bindSelectionHandlers() {
    items.forEach((item) => {
      const link = item.querySelector('.m_form_dropdown-link');
      if (!link) return;

      link.addEventListener('click', function () {
        if (item.hidden || item.style.display === 'none') return;

        setHiddenFields(
          item.dataset.label || '',
          item.dataset.value || '',
          item.dataset.isoStart || '',
          item.dataset.isoEnd || ''
        );
      });
    });
  }

  applyFiltering();
  setDefaultHiddenValues();
  bindSelectionHandlers();
});
