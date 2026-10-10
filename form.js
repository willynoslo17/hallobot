(function () {
  var ENDPOINT = "https://ml-inbox.willynoslo17.workers.dev/lead";
  var ALLOWED = ["start", "pluss", "nettbutikk", "usikker"];

  var MSG = {
    ok: "Takk! Meldingen din er sendt. Vi tar kontakt så snart som mulig.",
    rate: "For mange forsøk. Vent et minutt og prøv igjen.",
    forbidden: "Vi kunne ikke bekrefte at du er et menneske. Last inn siden på nytt og prøv igjen.",
    err: "Beklager, noe gikk galt. Prøv igjen, eller send oss en e-post på kontakt@mlinternasjonal.no.",
    waitTurnstile: "Vent til sikkerhetssjekken er ferdig, og prøv igjen."
  };

  function preselectPakke() {
    var select = document.getElementById("pakke");
    if (!select) return;
    var params = new URLSearchParams(window.location.search);
    var value = (params.get("pakke") || "").toLowerCase();
    if (ALLOWED.indexOf(value) === -1) value = "usikker";
    select.value = value;
  }

  function setTs(form) {
    var ts = form.querySelector('input[name="ts"]');
    if (ts) ts.value = String(Date.now());
  }

  function resetTurnstile() {
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      try {
        window.turnstile.reset();
      } catch (e) {}
    }
  }

  function getTurnstileToken(form) {
    var el = form.querySelector('[name="cf-turnstile-response"]');
    return el && el.value ? el.value.trim() : "";
  }

  function setStatus(status, text) {
    if (!status) return;
    status.className = "form-status";
    status.textContent = text;
  }

  function onSubmit(e) {
    var form = e.target;
    if (!form || form.id !== "kontakt-form") return;
    e.preventDefault();

    var status = document.getElementById("form-status");
    var btn = form.querySelector('[type="submit"]');
    var token = getTurnstileToken(form);

    if (!token) {
      setStatus(status, MSG.waitTurnstile);
      return;
    }

    var payload = {
      nombre: (form.navn && form.navn.value || "").trim(),
      email: (form.epost && form.epost.value || "").trim(),
      telefono: (form.telefon && form.telefon.value || "").trim() || "",
      mensaje: (form.melding && form.melding.value || "").trim(),
      marca: "hallobot",
      pagina: window.location.pathname,
      turnstile_token: token,
      website: (form.website && form.website.value || "").trim(),
      ts: Number(form.ts && form.ts.value) || Date.now()
    };

    if (form.bedrift) {
      payload.empresa = (form.bedrift.value || "").trim();
    }

    if (btn) btn.disabled = true;
    setStatus(status, "");

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.status === 200) {
          setStatus(status, MSG.ok);
          if (status) status.className = "form-status ok";
          form.reset();
          preselectPakke();
          setTs(form);
          return;
        }
        if (res.status === 429) {
          setStatus(status, MSG.rate);
          if (status) status.className = "form-status error";
          return;
        }
        if (res.status === 403) {
          setStatus(status, MSG.forbidden);
          if (status) status.className = "form-status error";
          return;
        }
        setStatus(status, MSG.err);
        if (status) status.className = "form-status error";
      })
      .catch(function () {
        setStatus(status, MSG.err);
        if (status) status.className = "form-status error";
      })
      .finally(function () {
        resetTurnstile();
        if (btn) btn.disabled = false;
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    preselectPakke();
    var form = document.getElementById("kontakt-form");
    if (!form) return;
    setTs(form);
    form.addEventListener("submit", onSubmit);
  });
})();
