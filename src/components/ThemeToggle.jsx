import PropTypes from "prop-types";
import { THEME_OPTIONS } from "../hooks/useThemePreference";

const getNextTheme = (current) => {
  const index = THEME_OPTIONS.indexOf(current);
  if (index === -1) {
    return THEME_OPTIONS[0];
  }
  return THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length];
};

function ThemeToggle({ value, onChange }) {
  const nextTheme = getNextTheme(value);
  const ariaLabel = `toggle theme (current: ${value}, next: ${nextTheme})`;

  return (
    <button
      type="button"
      className={`theme-toggle-button theme-${value}`}
      onClick={() => onChange(nextTheme)}
      aria-label={ariaLabel}
      title={`switch theme (current: ${value})`}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        💡
      </span>
      <span className="theme-toggle-text">{value}</span>
    </button>
  );
}

ThemeToggle.propTypes = {
  value: PropTypes.oneOf(THEME_OPTIONS).isRequired,
  onChange: PropTypes.func.isRequired
};

export default ThemeToggle;

