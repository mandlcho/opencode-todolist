import PropTypes from "prop-types";
import ThemeToggle from "./ThemeToggle";

function AppHeader({ viewMode, onViewModeChange, themeMode, onThemeModeChange }) {
  return (
    <header className="app-header">
      <div className="app-header-top">
        <h1>tasks</h1>
        <div className="header-controls">
          <ThemeToggle value={themeMode} onChange={onThemeModeChange} />
          <div className="view-toggles" role="group" aria-label="view mode">
            <button
              type="button"
              className={viewMode === "list" ? "view-option active" : "view-option"}
              onClick={() => onViewModeChange("list")}
              aria-pressed={viewMode === "list"}
            >
              list
            </button>
            <button
              type="button"
              className={viewMode === "card" ? "view-option active" : "view-option"}
              onClick={() => onViewModeChange("card")}
              aria-pressed={viewMode === "card"}
            >
              card
            </button>
          </div>
        </div>
      </div>
      <p>simple task app</p>
    </header>
  );
}

AppHeader.propTypes = {
  viewMode: PropTypes.oneOf(["list", "card"]).isRequired,
  onViewModeChange: PropTypes.func.isRequired,
  themeMode: PropTypes.oneOf(["light", "dark", "system"]).isRequired,
  onThemeModeChange: PropTypes.func.isRequired
};

export default AppHeader;

