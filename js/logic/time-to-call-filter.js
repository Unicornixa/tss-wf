(async function () {
  const LOG_PREFIX = "[time-to-call]";
  const PARIS_TIMEZONE = "Europe/Paris";

  const dropdown = document.querySelector('[data-dropdown="time_to_call"]');
  console.log(LOG_PREFIX, "dropdown found:", dropdown);

  if (!dropdown) return;

  const form = dropdown.closest("form");
  console.log(LOG_PREFIX, "form found:", form);

  if (!form) return;

  const items = Array.from(dropdown.querySelectorAll(".w-dyn-item"));
  console.log(LOG_PREFIX, "items found:", items.length, items);

  if (!items.length) return;

  function getOrCreateHiddenField(name, id) {
    let field = form.querySelector(`[name="${name}"]`);

    if (!field) {
      field = document.createElement("input");
      field.type = "hidden";
      field.name = name;
      if (id) field.id = id;
      form.appendChild(field);
      console.log(LOG_PREFIX, `created hidden field: ${name}`);
    } else {
      console.log(LOG_PREFIX, `found existing hidden field: ${name}`, field);
    }

    return field;
  }

  const timeToCallLabelField = getOrCreateHiddenField("TimeToCallLabel", "time-to-call-label");
  const timeToCallValueField = getOrCreateHiddenField("TimeToCallValue", "time-to-call-value");
  const timeToCallStartField = getOrCreateHiddenField("TimeToCallStart", "time-to-call-start");
  const timeToCallEndField = getOrCreateHiddenField("TimeToCallEnd", "time-to-call-end");
  const timeToCallTimezoneField = getOrCreateHiddenField("TimeToCallTimezone", "time-to-call-timezone");

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
      if (part.type !== "literal") {
        map[part.type] = part.value;
      }
    });

    const result = {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: Number(map.hour),
      minute: Number(map.minute),
      second: Number(map.second),
      weekdayShort: map.weekday
    };

    console.log(LOG_PREFIX, "paris now parts:", result);
    return result;
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

    const weekdayIndex = map[weekdayShort];
    console.log(LOG_PREFIX, "weekday mapping:", weekdayShort, "->", weekdayIndex);
    return weekdayIndex;
  }

  function getAllowedDayGroups(weekdayIndex) {
    let groups = [];

    if (weekdayIndex >= 1 && weekdayIndex <= 4) {
      groups = ["asap", "today", "tomorrow"];
    } else if (weekdayIndex === 5) {
      groups = ["asap", "today", "monday"];
    } else {
      groups = ["asap", "monday", "tuesday"];
    }

    console.log(LOG_PREFIX, "allowed day groups:", groups);
    return groups;
  }

  function pad(num) {
    return String(num).padStart(2, "0");
  }

  function getIsoDate(year, month, day) {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function addDaysToDateParts(year, month, day, daysToAdd) {
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    utcDate.setUTCDate(utcDate.getUTCDate() + daysToAdd);

    const result = {
      year: utcDate.getUTCFullYear(),
      month: utcDate.getUTCMonth() + 1,
      day: utcDate.getUTCDate()
    };

    console.log(LOG_PREFIX, "addDaysToDateParts:", { year, month, day, daysToAdd, result });
    return result;
  }

  function getTargetDateForDayGroup(dayGroup, parisNow) {
    const weekdayIndex = getParisWeekdayIndex(parisNow.weekdayShort);

    if (dayGroup === "today") {
      return {
        year: parisNow.year,
        month: parisNow.month,
        day: parisNow.day
      };
    }

    if (dayGroup === "tomorrow") {
      return addDaysToDateParts(parisNow.year, parisNow.month, parisNow.day, 1);
    }

    if (dayGroup === "monday") {
      const daysUntilMonday = weekdayIndex === 0 ? 1 : (8 - weekdayIndex) % 7;
      return addDaysToDateParts(parisNow.year, parisNow.month, parisNow.day, daysUntilMonday);
    }

    if (dayGroup === "tuesday") {
      let daysUntilTuesday = (2 - weekdayIndex + 7) % 7;
      if (daysUntilTuesday === 0) daysUntilTuesday = 7;
      return addDaysToDateParts(parisNow.year, parisNow.month, parisNow.day, daysUntilTuesday);
    }

    return null;
  }

  function buildLocalDateTime(dateParts, timeString) {
    if (!dateParts || !timeString) return "";
    return `${getIsoDate(dateParts.year, dateParts.month, dateParts.day)}T${timeString}:00`;
  }

  function timeStringToMinutes(timeString) {
    if (!timeString) return null;

    const [hours, minutes] = timeString.split(":").map(Number);
    return (hours * 60) + minutes;
  }

  function getCurrentParisMinutes(parisNow) {
    const result = (parisNow.hour * 60) + parisNow.minute;
    console.log(LOG_PREFIX, "current paris minutes:", result);
    return result;
  }

  function setHiddenFields({ label, value, start, end }) {
    timeToCallLabelField.value = label || "";
    timeToCallValueField.value = value || "";
    timeToCallStartField.value = start || "";
    timeToCallEndField.value = end || "";
    timeToCallTimezoneField.value = PARIS_TIMEZONE;

    console.log(LOG_PREFIX, "hidden fields set:", {
      label: timeToCallLabelField.value,
      value: timeToCallValueField.value,
      start: timeToCallStartField.value,
      end: timeToCallEndField.value,
      timezone: timeToCallTimezoneField.value
    });
  }

  function showItem(item) {
    item.hidden = false;
    item.style.display = "";
  }

  function hideItem(item) {
    item.hidden = true;
    item.style.display = "none";
  }

  function applyFiltering() {
    console.log(LOG_PREFIX, "applying filtering...");

    const parisNow = getParisNowParts();
    const weekdayIndex = getParisWeekdayIndex(parisNow.weekdayShort);
    const allowedGroups = getAllowedDayGroups(weekdayIndex);
    const currentParisMinutes = getCurrentParisMinutes(parisNow);

    items.forEach((item, index) => {
      const label = item.dataset.label || "";
      const value = item.dataset.value || "";
      const dayGroup = item.dataset.dayGroup || "";
      const start = item.dataset.start || "";
      const end = item.dataset.end || "";

      let shouldShow = allowedGroups.includes(dayGroup);

      console.log(LOG_PREFIX, `item ${index + 1} before filtering:`, {
        label,
        value,
        dayGroup,
        start,
        end,
        shouldShowInitial: shouldShow
      });

      // For "today" options, hide slot if its END time has already passed
      if (shouldShow && dayGroup === "today" && end) {
        const slotEndMinutes = timeStringToMinutes(end);

        console.log(LOG_PREFIX, `item ${index + 1} today end-time check:`, {
          label,
          slotEndMinutes,
          currentParisMinutes
        });

        if (slotEndMinutes !== null && slotEndMinutes <= currentParisMinutes) {
          shouldShow = false;
        }
      }

      if (shouldShow) {
        const targetDate = getTargetDateForDayGroup(dayGroup, parisNow);

        if (dayGroup === "asap") {
          item.dataset.isoStart = "";
          item.dataset.isoEnd = "";
        } else {
          item.dataset.isoStart = buildLocalDateTime(targetDate, start);
          item.dataset.isoEnd = buildLocalDateTime(targetDate, end);
        }

        showItem(item);

        console.log(LOG_PREFIX, `SHOW item ${index + 1}:`, {
          label,
          value,
          dayGroup,
          isoStart: item.dataset.isoStart,
          isoEnd: item.dataset.isoEnd
        });
      } else {
        item.dataset.isoStart = "";
        item.dataset.isoEnd = "";
        hideItem(item);

        console.log(LOG_PREFIX, `HIDE item ${index + 1}:`, {
          label,
          value,
          dayGroup
        });
      }
    });

    const visibleItems = items.filter((item) => item.style.display !== "none");
    console.log(LOG_PREFIX, "visible items after filtering:", visibleItems.length, visibleItems);
  }

  function getDefaultItem() {
    const asapItem = items.find(
      (item) => !item.hidden && item.dataset.value === "asap"
    );

    if (asapItem) {
      console.log(LOG_PREFIX, "default item: ASAP", asapItem);
      return asapItem;
    }

    const firstVisibleItem = items.find((item) => !item.hidden) || null;
    console.log(LOG_PREFIX, "default item fallback:", firstVisibleItem);
    return firstVisibleItem;
  }

  function updateFieldsFromItem(item) {
    if (!item) return;

    setHiddenFields({
      label: item.dataset.label || "",
      value: item.dataset.value || "",
      start: item.dataset.isoStart || "",
      end: item.dataset.isoEnd || ""
    });
  }

  function bindSelectionHandlers() {
    console.log(LOG_PREFIX, "binding selection handlers...");

    items.forEach((item, index) => {
      const link = item.querySelector(".m_form_dropdown-link");

      if (!link) {
        console.warn(LOG_PREFIX, `item ${index + 1} has no .m_form_dropdown-link`, item);
        return;
      }

      link.addEventListener("click", function () {
        console.log(LOG_PREFIX, `click item ${index + 1}:`, {
          label: item.dataset.label,
          value: item.dataset.value,
          hidden: item.hidden,
          display: item.style.display,
          isoStart: item.dataset.isoStart,
          isoEnd: item.dataset.isoEnd
        });

        if (item.hidden || item.style.display === "none") {
          console.log(LOG_PREFIX, "click ignored because item is hidden");
          return;
        }

        updateFieldsFromItem(item);
      });
    });
  }

  function initializeDefaultFields() {
    const defaultItem = getDefaultItem();

    if (!defaultItem) {
      console.warn(LOG_PREFIX, "no default item found after filtering");
      return;
    }

    updateFieldsFromItem(defaultItem);
  }

  applyFiltering();
  initializeDefaultFields();
  bindSelectionHandlers();

  window.timeToCallDebug = {
    dropdown,
    form,
    items,
    applyFiltering,
    initializeDefaultFields,
    updateFieldsFromItem
  };

  console.log(LOG_PREFIX, "debug helper available as window.timeToCallDebug");
})();
