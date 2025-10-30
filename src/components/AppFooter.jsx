import PropTypes from "prop-types";

function AppFooter({
  stats,
  onArchiveCompleted,
  onToggleArchive,
  isArchiveOpen,
  archivedCount,
  archiveToggleRef = null
}) {
  return (
    <footer className="app-footer">
      <div className="footer-stats">
        <span>total: {stats.total}</span>
        <span>done: {stats.completed}</span>
        <span>remaining: {stats.remaining}</span>
      </div>
      <div className="footer-actions">
        <button
          type="button"
          onClick={onArchiveCompleted}
          disabled={stats.completed === 0}
        >
          archive
        </button>
        <button
          type="button"
          onClick={onToggleArchive}
          ref={archiveToggleRef}
          disabled={archivedCount === 0}
          aria-expanded={isArchiveOpen}
          aria-controls="archive-drawer"
        >
          {isArchiveOpen ? "hide archived" : `show archived (${archivedCount})`}
        </button>
      </div>
    </footer>
  );
}

AppFooter.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    completed: PropTypes.number.isRequired,
    remaining: PropTypes.number.isRequired
  }).isRequired,
  onArchiveCompleted: PropTypes.func.isRequired,
  onToggleArchive: PropTypes.func.isRequired,
  isArchiveOpen: PropTypes.bool.isRequired,
  archivedCount: PropTypes.number.isRequired,
  archiveToggleRef: PropTypes.shape({
    current: PropTypes.any
  })
};

export default AppFooter;
