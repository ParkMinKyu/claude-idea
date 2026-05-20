// Color themes for code rendering.
export const THEMES = {
  dark: {
    bg: "#1e1e2e",
    window: "#181825",
    text: "#cdd6f4",
    keyword: "#cba6f7",
    string: "#a6e3a1",
    comment: "#6c7086",
    number: "#fab387",
    lineNumber: "#45475a",
  },
  light: {
    bg: "#ffffff",
    window: "#f0f0f0",
    text: "#24292f",
    keyword: "#cf222e",
    string: "#0a3069",
    comment: "#6e7781",
    number: "#0550ae",
    lineNumber: "#afb8c1",
  },
};

export function getTheme(name = "dark") {
  return THEMES[name] ?? THEMES.dark;
}
