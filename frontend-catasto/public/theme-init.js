// Applica il tema prima del primo paint: senza, chi usa il tema scuro vede un
// lampo chiaro a ogni caricamento. File esterno e non script inline, che la
// CSP (script-src 'self') bloccherebbe. Stessa logica di useDarkMode.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem("theme");
  } catch {
    // storage non disponibile: si usa la preferenza di sistema
  }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.classList.add(theme);
})();
