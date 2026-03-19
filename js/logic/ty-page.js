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

  const ZIP_JSON_URL = "https://cdn.jsdelivr.net/gh/unicornixa/tss-wf@d38e829/data/fr-zip-state-code-map.json"; //change this to @main later

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
  // BUTTON LOGIC
  // ========================
  const calendarBtn = document.querySelector('[data-button="calendar"]');
  const contactsBtn = document.querySelector('[data-button="contacts"]');

  const isAsap = (timeToCall.value || "").includes("asap");

  // Contacts = default
  if (contactsBtn) {
    contactsBtn.style.display = isAsap ? "inline-flex" : "none";
  }
  
  // Calendar = opposite of asap
  if (calendarBtn) {
    calendarBtn.style.display = isAsap ? "none" : "inline-flex";
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
  }

  if (contactsBtn) {
    contactsBtn.addEventListener("click", downloadVCard);
  }

  // ========================
  // CALENDAR DOWNLOAD (.ics)
  // ========================
  function formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  function downloadICS() {
    if (!timeToCall.start || !timeToCall.end) {
      console.warn("[TY] Missing timeToCall start/end");
      return;
    }

    const start = new Date(timeToCall.start);
    const end = new Date(timeToCall.end);
    const now = new Date();

    const diffMinutes = (start - now) / 60000;

    const description = `Nous vous appelons depuis ${phone.display}. Nous confirmerons vos besoins pour finaliser votre bilan personnalisé et vous proposer le professeur idéal, sans engagement 🎉`;

    let alarm = "";

    // Option A logic
    if (diffMinutes > 15) {
      alarm = `BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Rappel appel Top Soutien Scolaire
END:VALARM`;
    }

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Appel avec Top Soutien Scolaire
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
    a.download = "appel.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (calendarBtn) {
    calendarBtn.addEventListener("click", downloadICS);
  }

  console.log("[TY] Script finished");
})();
