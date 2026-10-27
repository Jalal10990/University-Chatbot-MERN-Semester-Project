export function scrollToSection(id) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }
}