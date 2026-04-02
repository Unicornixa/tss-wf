(async function () {
  const PARIS_TIMEZONE = "Europe/Paris";

  const dropdown = document.querySelector('[data-dropdown="time_to_call"]');
  if (!dropdown) return;

  const form = dropdown.closest("form");
  if (!form) return;

  const allItems = Array.from(dropdown.querySelectorAll(".w-dyn-item"));
  if (!allItems.length) return;

  const holidayControlItem = allItems.find(
    (item) => item.getAttribute("holiday-date") === "true"
  );

  const items = allItems.filter(
    (item) => item.getAttribute("holiday-date") !== "true"
  );

  if (!items.length) return;

  function getOrCreateHiddenField(name, id) {
    let field = form.querySelector(`input[type="hidden"][name="${name}"]`);

    if (!field) {
      field = document.createElement("input");
      field.type = "hidden";
      field.name = name;
      if (id) field.id = id;
      form.appendChild(field);
    }

    return field;
  }

  const labelField = getOrCreateHiddenField("TimeToCallLabel", "time-to-call-label");
  const valueField = getOrCreateHiddenField("TimeToCallValue", "time-to-call-value");
  const startField = getOrCreateHiddenField("TimeToCallStart", "time-to-call-start");
  const endField = getOrCreateHiddenField("TimeToCallEnd", "time-to-call-end");
  const timezoneField = getOrCreateHiddenField("TimeToCallTimezone", "time-to-call-timezone");

  function getParisNowParts() {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: PARIS_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });

    const parts = formatter.formatToParts(now);
    const map = {};

    parts.forEach((part) => {
      if (part.type !== "literal") map[part.type] = part.value;
    });

    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(map.hour),
      minute: Number(map.minute),
      weekdayShort: map.weekday
    };
  }

  function getParisWeekdayIndex(weekdayShort) {
    return {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6
    }[weekdayShort];
  }

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function getIsoDate(y, m, d) {
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  function addDays(y, m, d, days) {
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);

    return {
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth() + 1,
      day: dt.getUTCDate()
    };
  }

  function normalizeDateString(value) {
    if (!value) return "";
    return String(value).trim().slice(0, 10);
  }

  function getDateKey(value) {
    const normalized = normalizeDateString(value);
    if (!normalized) return null;

    const parts = normalized.split("-");
    if (parts.length !== 3) return null;

    const [year, month, day] = parts.map(Number);
    if (!year || !month || !day) return null;

    return year * 10000 + month * 100 + day;
  }

  function getHolidayRange() {
    if (!holidayControlItem) return null;

    const startRaw = holidayControlItem.getAttribute("holiday-date-start") || "";
    const endRaw = holidayControlItem.getAttribute("holiday-date-end") || "";

    const start = normalizeDateString(startRaw);
    const end = normalizeDateString(endRaw);

    if (!start || !end) return null;

    const startKey = getDateKey(start);
    const endKey = getDateKey(end);

    if (startKey === null || endKey === null) return null;

    return {
      start,
      end,
      startKey,
      endKey
    };
  }

  function isDateInHolidayRange(isoDate, holidayRange) {
    if (!holidayRange || !isoDate) return false;

    const dateKey = getDateKey(isoDate);
    if (dateKey === null) return false;

    return dateKey >= holidayRange.startKey && dateKey <= holidayRange.endKey;
  }

  function getTargetDate(group, now) {
    const w = getParisWeekdayIndex(now.weekdayShort);

    if (group === "today") return now;
    if (group === "tomorrow") return addDays(now.year, now.month, now.day, 1);

    if (group === "monday") {
      const diff = w === 0 ? 1 : (8 - w) % 7;
      return addDays(now.year, now.month, now.day, diff);
    }

    if (group === "tuesday") {
      let diff = (2 - w + 7) % 7;
      if (diff === 0) diff = 7;
      return addDays(now.year, now.month, now.day, diff);
    }

    if (group === "wednesday") {
      let diff = (3 - w + 7) % 7;
      if (diff === 0) diff = 7;
      return addDays(now.year, now.month, now.day, diff);
    }

    if (group === "thursday") {
      let diff = (4 - w + 7) % 7;
      if (diff === 0) diff = 7;
      return addDays(now.year, now.month, now.day, diff);
    }

    if (group === "friday") {
      let diff = (5 - w + 7) % 7;
      if (diff === 0) diff = 7;
      return addDays(now.year, now.month, now.day, diff);
    }

    return null;
  }

  function buildDateTime(date, time) {
    if (!date || !time) return "";
    return `${getIsoDate(date.year, date.month, date.day)}T${time}:00`;
  }

  function toMinutes(time) {
    if (!time) return null;
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  function getBaseAllowedDayGroups(weekdayIndex) {
    if (weekdayIndex >= 1 && weekdayIndex <= 4) {
      return ["asap", "today", "tomorrow"];
    }

    if (weekdayIndex === 5) {
      return ["asap", "today", "monday"];
    }

    return ["asap", "monday", "tuesday"];
  }

  function getFallbackDaySequence(weekdayIndex) {
    if (weekdayIndex >= 1 && weekdayIndex <= 4) {
      return ["tomorrow", "monday", "tuesday", "wednesday", "thursday", "friday"];
    }

    if (weekdayIndex === 5) {
      return ["monday", "tuesday", "wednesday", "thursday", "friday"];
    }

    return ["monday", "tuesday", "wednesday", "thursday", "friday"];
  }

  function getAllowedDayGroups(now, holidayRange) {
    const weekdayIndex = getParisWeekdayIndex(now.weekdayShort);
    const baseAllowed = getBaseAllowedDayGroups(weekdayIndex);
    const fallbackSequence = getFallbackDaySequence(weekdayIndex);

    const finalAllowed = [];
    const usedGroups = new Set();

    baseAllowed.forEach((group) => {
      if (group === "asap") {
        finalAllowed.push(group);
        usedGroups.add(group);
        return;
      }

      const targetDate = getTargetDate(group, now);
      const isoDate = targetDate
        ? getIsoDate(targetDate.year, targetDate.month, targetDate.day)
        : "";

      if (!isDateInHolidayRange(isoDate, holidayRange)) {
        finalAllowed.push(group);
        usedGroups.add(group);
        return;
      }

      const replacement = fallbackSequence.find((candidateGroup) => {
        if (usedGroups.has(candidateGroup)) return false;

        const candidateDate = getTargetDate(candidateGroup, now);
        const candidateIso = candidateDate
          ? getIsoDate(candidateDate.year, candidateDate.month, candidateDate.day)
          : "";

        if (!candidateIso) return false;
        if (isDateInHolidayRange(candidateIso, holidayRange)) return false;

        return true;
      });

      if (replacement) {
        finalAllowed.push(replacement);
        usedGroups.add(replacement);
      }
    });

    return finalAllowed;
  }

  function applyFiltering() {
    const now = getParisNowParts();
    const holidayRange = getHolidayRange();
    const allowed = getAllowedDayGroups(now, holidayRange);
    const currentMinutes = now.hour * 60 + now.minute;

    items.forEach((item) => {
      const group = item.dataset.dayGroup || "";
      const start = item.dataset.start || "";
      const end = item.dataset.end || "";

      let show = allowed.includes(group);

      if (show && group === "today" && end) {
        const endMinutes = toMinutes(end);
        if (endMinutes !== null && (endMinutes - currentMinutes) <= 10) {
          show = false;
        }
      }

      if (show) {
        const date = getTargetDate(group, now);
        const isoDate = date ? getIsoDate(date.year, date.month, date.day) : "";

        if (group !== "asap" && isDateInHolidayRange(isoDate, holidayRange)) {
          show = false;
        }
      }

      if (show) {
        const date = getTargetDate(group, now);

        if (group === "asap") {
          item.dataset.isoStart = "";
          item.dataset.isoEnd = "";
        } else {
          item.dataset.isoStart = buildDateTime(date, start);
          item.dataset.isoEnd = buildDateTime(date, end);
        }

        item.style.display = "";
        item.hidden = false;
      } else {
        item.dataset.isoStart = "";
        item.dataset.isoEnd = "";
        item.style.display = "none";
        item.hidden = true;
      }
    });
  }

  function setFields(item) {
    if (!item) return;

    labelField.value = item.dataset.label || "";
    valueField.value = item.dataset.value || "";
    startField.value = item.dataset.isoStart || "";
    endField.value = item.dataset.isoEnd || "";
    timezoneField.value = PARIS_TIMEZONE;
  }

  function getDefaultItem() {
    return items.find(
      (item) => !item.hidden && item.dataset.value === "asap"
    ) || items.find((item) => !item.hidden);
  }

  function bindClicks() {
    items.forEach((item) => {
      const link = item.querySelector(".m_form_dropdown-link");
      if (!link) return;

      link.addEventListener("click", () => {
        if (item.hidden) return;
        setFields(item);
      });
    });
  }

  applyFiltering();
  setFields(getDefaultItem());
  bindClicks();
})();
