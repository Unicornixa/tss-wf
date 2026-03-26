(async function () {
  console.log("[TY] Script started");

  // ========================
  // CONFIG
  // ========================
  const PHONE_CONFIG = {
    fallback: {
      display: "01 86 65 08 84",
      tel: "+33186650884"
    },
    byStateCode: {
      "84": {
        display: "04 81 68 53 08",
        tel: "+33481685308"
      }
      // add more here
    }
  };

  const ZIP_JSON_URL = "https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@d38e829/data/fr-zip-state-code-map.json"; // change this to @main later

  // ========================
  // GET STORED DATA
  // ========================
  const zip = sessionStorage.getItem("zip") || "";
  const timeToCall = JSON.parse(sessionStorage.getItem("timeToCall") || "{}");

  console.log("[TY] zip:", zip);
  console.log("[TY] timeToCall:", timeToCall);

  // ========================
  // GET STATE CODE
  // ========================
  let stateCode = null;

  try {
    const res = await fetch(ZIP_JSON_URL);
    const data = await res.json();

    stateCode = data[zip] || null;
    console.log("[TY] stateCode:", stateCode);
  } catch (e) {
    console.warn("[TY] Failed to fetch ZIP mapping:", e);
  }

  // ========================
  // RESOLVE PHONE
  // ========================
  let phone = PHONE_CONFIG.fallback;

  if (stateCode && PHONE_CONFIG.byStateCode[stateCode]) {
    phone = PHONE_CONFIG.byStateCode[stateCode];
  }

  console.log("[TY] phone selected:", phone);

  // ========================
  // UPDATE UI
  // ========================
  const phoneEl = document.querySelector("[data-phone-display]");
  const timeEl = document.querySelector("[data-time-label]");

  if (phoneEl) phoneEl.textContent = phone.display;
  if (timeEl && timeToCall.label) timeEl.textContent = timeToCall.label;

  // ========================
  // BUTTONS
  // ========================
  const calendarBtn = document.querySelector('[data-button="calendar"]');
  const contactsBtn = document.querySelector('[data-button="contacts"]');
  const googleBtn = document.querySelector('[data-button="google"]');
  const outlookBtn = document.querySelector('[data-button="outlook"]');

  const isAsap = (timeToCall.value || "").includes("asap");

  // Contacts = default for ASAP
  if (contactsBtn) {
    contactsBtn.style.display = isAsap ? "inline-flex" : "none";
  }

  // Calendar buttons = opposite of ASAP
  if (calendarBtn) {
    calendarBtn.style.display = isAsap ? "none" : "inline-flex";
  }

  if (googleBtn) {
    googleBtn.style.display = isAsap ? "none" : "inline-flex";
  }

  if (outlookBtn) {
    outlookBtn.style.display = isAsap ? "none" : "inline-flex";
  }

  // ========================
  // SHARED EVENT DATA
  // ========================
  function getEventData() {
    if (!timeToCall.start || !timeToCall.end) {
      console.warn("[TY] Missing timeToCall start/end");
      return null;
    }

    const start = new Date(timeToCall.start);
    const end = new Date(timeToCall.end);

    const title = "Appel avec Top Soutien Scolaire";
    const description = `Nous vous appelons depuis ${phone.display}. Nous confirmerons vos besoins pour finaliser votre bilan personnalisé et vous proposer le professeur idéal, sans engagement 🎉`;

    return { start, end, title, description };
  }

  // ========================
  // CONTACTS DOWNLOAD (.vcf)
  // ========================
  function downloadVCard() {
    let phones = "";

    if (phone.tel !== PHONE_CONFIG.fallback.tel) {
      phones += `TEL;TYPE=WORK,VOICE:${phone.tel}\n`;
      phones += `TEL;TYPE=WORK,VOICE:${PHONE_CONFIG.fallback.tel}\n`;
    } else {
      phones += `TEL;TYPE=WORK,VOICE:${PHONE_CONFIG.fallback.tel}\n`;
    }

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Top Soutien Scolaire
ORG:Top Soutien Scolaire
${phones}URL:https://www.topsoutienscolaire.fr
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "top-soutien-scolaire.vcf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  if (contactsBtn) {
    contactsBtn.addEventListener("click", function (e) {
      e.preventDefault();
      downloadVCard();
    });
  }

  // ========================
  // CALENDAR DOWNLOAD (.ics)
  // ========================
  function formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  function downloadICS() {
    const eventData = getEventData();
    if (!eventData) return;

    const { start, end, title, description } = eventData;
    const now = new Date();
    const diffMinutes = (start - now) / 60000;

    let alarm = "";

    if (diffMinutes > 15) {
      alarm = `BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Rappel appel Top Soutien Scolaire
END:VALARM`;
    }

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Top Soutien Scolaire//FR
BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
DESCRIPTION:${description}
${alarm}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "appel-top-soutien-scolaire.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  if (calendarBtn) {
    calendarBtn.addEventListener("click", function (e) {
      e.preventDefault();
      downloadICS();
    });
  }

  // ========================
  // GOOGLE / OUTLOOK LINKS
  // ========================
  function formatGoogleDate(date) {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  function formatOutlookDate(date) {
    return date.toISOString().split(".")[0] + "Z";
  }

  function buildGoogleCalendarUrl() {
    const eventData = getEventData();
    if (!eventData) return "#";

    const { start, end, title, description } = eventData;

    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", title);
    url.searchParams.set(
      "dates",
      `${formatGoogleDate(start)}/${formatGoogleDate(end)}`
    );
    url.searchParams.set("details", description);

    return url.toString();
  }

  function buildOutlookCalendarUrl() {
    const eventData = getEventData();
    if (!eventData) return "#";

    const { start, end, title, description } = eventData;

    const url = new URL("https://outlook.office.com/calendar/deeplink/compose");
    url.searchParams.set("subject", title);
    url.searchParams.set("startdt", formatOutlookDate(start));
    url.searchParams.set("enddt", formatOutlookDate(end));
    url.searchParams.set("body", description);

    return url.toString();
  }

  if (googleBtn) {
    googleBtn.setAttribute("href", buildGoogleCalendarUrl());
    googleBtn.setAttribute("target", "_blank");
    googleBtn.setAttribute("rel", "noopener");
  }

  if (outlookBtn) {
    outlookBtn.setAttribute("href", buildOutlookCalendarUrl());
    outlookBtn.setAttribute("target", "_blank");
    outlookBtn.setAttribute("rel", "noopener");
  }

  console.log("[TY] Script finished");
})();
