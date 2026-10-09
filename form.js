/* Mailto-levering: brukes når /api/kontakt ikke er konfigurert (ingen webhook). */
(function () {
  var EMAIL = "kontakt@mlinternasjonal.no";
  var SITE = "Hallobot";
  var SKIP = { website: 1, website_url: 1, samtykke: 1, consent: 1 };

  function ownText(label) {
    var t = "";
    for (var i = 0; i < label.childNodes.length; i++) {
      if (label.childNodes[i].nodeType === 3) t += label.childNodes[i].nodeValue;
    }
    return t.replace(/\*/g, "").replace(/\s+/g, " ").trim();
  }

  function labelFor(el) {
    var l = el.labels && el.labels[0];
    var t = l ? ownText(l) : "";
    return t || el.name.charAt(0).toUpperCase() + el.name.slice(1);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  window.kontaktMailtoFallback = function (form, lang) {
    var es = lang === "es";
    var lines = [];
    var groups = {};
    var order = [];
    var navn = "";
    var els = form.elements;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.name || SKIP[el.name] || el.disabled) continue;
      if (el.type === "submit" || el.type === "button" || el.type === "hidden") continue;
      if (el.type === "checkbox" || el.type === "radio") {
        if (!el.checked) continue;
        var fs = el.closest("fieldset");
        var lg = fs && fs.querySelector("legend");
        var head = lg ? lg.textContent.replace(/\*/g, "").trim() : el.name;
        if (!groups[el.name]) { groups[el.name] = { head: head, vals: [] }; order.push(el.name); }
        groups[el.name].vals.push(labelFor(el));
        continue;
      }
      var v = el.tagName === "SELECT" && el.selectedIndex >= 0
        ? el.options[el.selectedIndex].text
        : String(el.value || "").trim();
      if (!v) continue;
      if (el.name === "navn") navn = v;
      lines.push(labelFor(el) + ": " + v);
    }
    for (var g = 0; g < order.length; g++) {
      lines.push(groups[order[g]].head + ": " + groups[order[g]].vals.join(", "));
    }
    var body = lines.join("\n");
    if (body.length > 1800) body = body.slice(0, 1800) + "…";
    body += "\n\n— " + (es ? "Enviado desde el formulario de " : "Sendt fra kontaktskjemaet på ") + SITE + " (" + location.href + ")";
    var subject = SITE + (es ? " – consulta" : " – henvendelse") + (navn ? (es ? " de " : " fra ") + navn : "");
    var url = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    try { window.location.href = url; } catch (e) {}
    var a = '<a href="' + escapeHtml(url) + '">';
    return es
      ? "Abrimos tu programa de correo con el mensaje listo para " + escapeHtml(EMAIL) + ". Pulsa «Enviar» para completarlo. ¿No se abrió nada? " + a + "Haz clic aquí</a> o escribe a " + '<a href="mailto:' + EMAIL + '">' + EMAIL + "</a>."
      : "Vi åpner e-postprogrammet ditt med meldingen klar til " + escapeHtml(EMAIL) + ". Trykk «Send» for å fullføre. Åpnet ingenting? " + a + "Klikk her</a> eller skriv til " + '<a href="mailto:' + EMAIL + '">' + EMAIL + "</a>.";
  };
})();

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
          status.innerHTML = window.kontaktMailtoFallback(form, getLang());
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
