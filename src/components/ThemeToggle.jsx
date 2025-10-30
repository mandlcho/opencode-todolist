import PropTypes from "prop-types";
import { THEME_OPTIONS } from "../hooks/useThemePreference";

const LABELS = {
  light: "light",
  dark: "dark",
  system: "system"
};

function ThemeToggle({ value, onChange }) {
  return (
    <div className="theme-toggle" role="group" aria-label="theme mode">
      {THEME_OPTIONS.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            className={isActive ? "active" : ""}
            onClick={() => onChange(option)}
            aria-pressed={isActive}
          >
            {LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

ThemeToggle.propTypes = {
  value: PropTypes.oneOf(THEME_OPTIONS).isRequired,
  onChange: PropTypes.func.isRequired
};

export default ThemeToggle;

