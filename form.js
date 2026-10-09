(function () {
  var ALLOWED = ["start", "pluss", "nettbutikk", "usikker"];

  function getLang() {
    return document.documentElement.lang === "es" ? "es" : "nb";
  }

  function messages() {
    var es = getLang() === "es";
    return {
      ok: es
        ? "¡Gracias! Respondo en un día laborable."
        : "Takk! Jeg svarer innen 1 virkedag.",
      err: es
        ? 'No se pudo enviar. Escríbeme a <a href="mailto:kontakt@mlinternasjonal.no?subject=Hallobot">kontakt@mlinternasjonal.no</a>.'
        : 'Kunne ikke sende. Skriv til <a href="mailto:kontakt@mlinternasjonal.no?subject=Hallobot">kontakt@mlinternasjonal.no</a>.',
      sending: es ? "Enviando…" : "Sender…"
    };
  }

  function preselectPakke() {
    var select = document.getElementById("pakke");
    if (!select) return;
    var params = new URLSearchParams(window.location.search);
    var value = (params.get("pakke") || "").toLowerCase();
    if (ALLOWED.indexOf(value) === -1) value = "usikker";
    select.value = value;
  }

  function collectSprak(form) {
    var out = [];
    var boxes = form.querySelectorAll('input[name="sprak"]:checked');
    for (var i = 0; i < boxes.length; i++) {
      out.push(boxes[i].value);
    }
    return out;
  }

  function onSubmit(e) {
    var form = e.target;
    if (!form || form.id !== "kontakt-form") return;
    e.preventDefault();

    var status = document.getElementById("form-status");
    var msg = messages();
    var btn = form.querySelector('[type="submit"]');

    var payload = {
      navn: (form.navn && form.navn.value || "").trim(),
      bedrift: (form.bedrift && form.bedrift.value || "").trim(),
      epost: (form.epost && form.epost.value || "").trim(),
      telefon: (form.telefon && form.telefon.value || "").trim(),
      nettside: (form.nettside && form.nettside.value || "").trim(),
      sprak: collectSprak(form),
      melding: (form.melding && form.melding.value || "").trim(),
      pakke: (form.pakke && form.pakke.value || "usikker").toLowerCase(),
      samtykke: !!(form.samtykke && form.samtykke.checked),
      website: (form.website && form.website.value || "").trim(),
      pageLang: getLang()
    };

    if (status) {
      status.className = "form-status";
      status.innerHTML = msg.sending;
    }
    if (btn) btn.disabled = true;

    fetch("/api/kontakt", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (res.ok) {
          if (status) {
            status.className = "form-status ok";
            status.textContent = msg.ok;
          }
          form.reset();
          preselectPakke();
          return;
        }
        throw new Error("fail");
      })
      .catch(function () {
        if (status) {
          status.className = "form-status error";
          status.innerHTML = msg.err;
        }
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    preselectPakke();
    var form = document.getElementById("kontakt-form");
    if (form) form.addEventListener("submit", onSubmit);
  });
})();
