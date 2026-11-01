/**
 * Cortex Hub - Landing page: sign in / sign up dialogs and guest entry.
 * Signed-in visitors go straight to the app.
 */

const APP_URL = "/app";
const THEME_KEY = "cortex_hub_theme";

// Already signed in? Skip the landing page.
fetch("/api/auth/me")
  .then((res) => (res.ok ? res.json() : null))
  .then((data) => {
    if (data?.user) window.location.replace(APP_URL);
  })
  .catch(() => {});

// --------------------------------------------------------------------------
// Theme
// --------------------------------------------------------------------------
const themeBtn = document.getElementById("theme-toggle");
function syncThemeLabel() {
  const theme = document.documentElement.getAttribute("data-theme");
  themeBtn.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
}
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage unavailable (private mode): theme still applies for this visit
  }
  syncThemeLabel();
});
syncThemeLabel();

// --------------------------------------------------------------------------
// Dialogs
// --------------------------------------------------------------------------
const dialogs = {
  signin: document.getElementById("dialog-signin"),
  signup: document.getElementById("dialog-signup")
};

function openDialog(name, accountType) {
  for (const [key, dialog] of Object.entries(dialogs)) {
    if (key !== name && dialog.open) dialog.close();
  }
  const dialog = dialogs[name];
  if (!dialog) return;
  dialog.querySelector(".form-error").textContent = "";
  if (accountType) {
    const radio = dialog.querySelector(`input[name="accountType"][value="${accountType}"]`);
    if (radio) radio.checked = true;
  }
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('input:not([type="radio"])')?.focus();
}

document.querySelectorAll("[data-open]").forEach((btn) => {
  btn.addEventListener("click", () => openDialog(btn.dataset.open, btn.dataset.account));
});

for (const dialog of Object.values(dialogs)) {
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
  // Click on the backdrop closes the dialog
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
}

// Deep links: /#signin or /#signup open the matching dialog
const hash = window.location.hash.slice(1);
if (hash === "signin" || hash === "signup") openDialog(hash);

// --------------------------------------------------------------------------
// Forms
// --------------------------------------------------------------------------
async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.issues?.[0]?.message;
    throw new Error(detail || data.error || "Something went wrong. Please try again.");
  }
  return data;
}

function wireForm(form, { validate, submit }) {
  const errorEl = form.querySelector(".form-error");
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    const values = Object.fromEntries(new FormData(form));
    for (const key of Object.keys(values)) values[key] = String(values[key]).trim();
    const problem = validate(values);
    if (problem) {
      errorEl.textContent = problem;
      return;
    }
    button.disabled = true;
    button.textContent = "Please wait…";
    try {
      await submit(values);
      window.location.href = APP_URL;
    } catch (err) {
      errorEl.textContent = err.message;
      button.disabled = false;
      button.textContent = label;
    }
  });
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

wireForm(document.getElementById("form-signin"), {
  validate: (v) => {
    if (!EMAIL.test(v.email)) return "Enter the email you signed up with.";
    if (!v.password) return "Enter your password.";
    return null;
  },
  submit: (v) => postJson("/api/auth/login", { email: v.email, password: v.password })
});

wireForm(document.getElementById("form-signup"), {
  validate: (v) => {
    if (!v.name) return "Enter your name.";
    if (!EMAIL.test(v.email)) return "Enter a valid email address.";
    if (v.workspaceName.length < 2) return "Enter your company or team name.";
    if (v.password.length < 12) return "Use a password of at least 12 characters.";
    return null;
  },
  submit: (v) =>
    postJson("/api/auth/register", {
      name: v.name,
      email: v.email,
      password: v.password,
      workspaceName: v.workspaceName,
      accountType: v.accountType
    })
});
