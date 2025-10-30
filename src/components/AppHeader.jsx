import PropTypes from "prop-types";

function AppHeader({ viewMode, onViewModeChange }) {
  return (
    <header className="app-header">
      <div>
        <h1>tasks</h1>
        <p>simple task app</p>
      </div>
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
    </header>
  );
}

AppHeader.propTypes = {
  viewMode: PropTypes.oneOf(["list", "card"]).isRequired,
  onViewModeChange: PropTypes.func.isRequired
};

export default AppHeader;

