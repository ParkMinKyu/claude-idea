// Generic live-demo runner. Each demo bundle sets window.__DEMO_SPEC__ to:
// { title, description, fields:[{name,type,label,placeholder,default,options?}], run(values)->results, autorun? }
// run() returns an array of { label, type, value } where type ∈ text|code|html|svg|json|list|error|badge
(function () {
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return e;
  }

  function renderResult(r) {
    const wrap = el("div", { class: "demo-result" });
    wrap.appendChild(el("div", { class: "demo-result-label" }, [r.label || ""]));
    const body = el("div", { class: "demo-result-body" });
    switch (r.type) {
      case "svg":
        body.innerHTML = r.value;
        body.classList.add("demo-svg");
        break;
      case "html":
        body.innerHTML = r.value;
        break;
      case "code":
      case "json": {
        const pre = el("pre");
        pre.appendChild(el("code", {}, [typeof r.value === "string" ? r.value : JSON.stringify(r.value, null, 2)]));
        body.appendChild(pre);
        break;
      }
      case "list": {
        const ul = el("ul", { class: "demo-list" });
        (r.value || []).forEach((it) => ul.appendChild(el("li", {}, [typeof it === "string" ? it : JSON.stringify(it)])));
        body.appendChild(ul);
        break;
      }
      case "badge":
        body.appendChild(el("span", { class: "demo-badge demo-badge-" + (r.tone || "neutral") }, [String(r.value)]));
        break;
      case "error":
        body.classList.add("demo-error");
        body.textContent = String(r.value);
        break;
      default:
        body.textContent = typeof r.value === "string" ? r.value : JSON.stringify(r.value);
    }
    wrap.appendChild(body);
    return wrap;
  }

  function mount() {
    const spec = window.__DEMO_SPEC__;
    const root = document.getElementById("demo-root");
    if (!spec || !root) return;

    root.innerHTML = "";
    if (spec.description) root.appendChild(el("p", { class: "demo-desc" }, [spec.description]));

    const form = el("div", { class: "demo-form" });
    const inputs = {};

    (spec.fields || []).forEach((f) => {
      const field = el("div", { class: "demo-field" });
      field.appendChild(el("label", { class: "demo-field-label" }, [f.label || f.name]));
      let input;
      if (f.type === "textarea") {
        input = el("textarea", { class: "demo-input", rows: f.rows || "6", placeholder: f.placeholder || "" });
        input.value = f.default || "";
      } else if (f.type === "select") {
        input = el("select", { class: "demo-input" });
        (f.options || []).forEach((o) => {
          const opt = el("option", { value: o.value != null ? o.value : o }, [o.label || o]);
          input.appendChild(opt);
        });
        if (f.default != null) input.value = f.default;
      } else if (f.type === "number") {
        input = el("input", { class: "demo-input", type: "number", placeholder: f.placeholder || "" });
        input.value = f.default != null ? f.default : "";
      } else {
        input = el("input", { class: "demo-input", type: "text", placeholder: f.placeholder || "" });
        input.value = f.default || "";
      }
      inputs[f.name] = input;
      field.appendChild(input);
      form.appendChild(field);
    });

    root.appendChild(form);

    const runBtn = el("button", { class: "demo-run-btn" }, ["▶ 실행"]);
    root.appendChild(runBtn);

    const out = el("div", { class: "demo-output" });
    root.appendChild(out);

    function run() {
      const values = {};
      for (const k in inputs) {
        const inp = inputs[k];
        values[k] = inp.type === "number" ? Number(inp.value) : inp.value;
      }
      out.innerHTML = "";
      let results;
      try {
        results = spec.run(values);
      } catch (err) {
        out.appendChild(renderResult({ label: "오류", type: "error", value: err && err.message ? err.message : String(err) }));
        return;
      }
      (results || []).forEach((r) => out.appendChild(renderResult(r)));
    }

    runBtn.addEventListener("click", run);
    if (spec.autorun !== false) {
      run();
      // live re-run on input for text-ish fields
      Object.values(inputs).forEach((inp) => inp.addEventListener("input", run));
      Object.values(inputs).forEach((inp) => inp.addEventListener("change", run));
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
