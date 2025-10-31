import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseISODate = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, month, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const todayIso = toISODate(new Date());

function buildCalendarDays(referenceMonth) {
  const startOfMonth = new Date(
    referenceMonth.getFullYear(),
    referenceMonth.getMonth(),
    1
  );
  const startDay = startOfMonth.getDay();
  const firstVisibleDate = new Date(startOfMonth);
  firstVisibleDate.setDate(firstVisibleDate.getDate() - startDay);

  const days = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(
      firstVisibleDate.getFullYear(),
      firstVisibleDate.getMonth(),
      firstVisibleDate.getDate() + index
    );
    days.push({
      date,
      iso: toISODate(date),
      inMonth: date.getMonth() === referenceMonth.getMonth()
    });
  }
  return days;
}

function CalendarPicker({ value, onChange, highlights = {}, onHoverDate = null }) {
  const initialSelected = useMemo(() => parseISODate(value) ?? new Date(), [value]);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialSelected.getFullYear(), initialSelected.getMonth(), 1)
  );

  const highlightDetails = useMemo(() => {
    if (!highlights || typeof highlights !== "object") {
      return new Map();
    }
    return new Map(
      Object.entries(highlights).map(([iso, detail]) => {
        const rawPriorities = Array.isArray(detail?.priorities)
          ? detail.priorities
          : [];
        const priorities = rawPriorities.filter(
          (priority) => typeof priority === "string" && priority.trim()
        );
        const count =
          Number.isFinite(detail?.count) && detail.count > 0
            ? detail.count
            : priorities.length;
        return [iso, { count, priorities }];
      })
    );
  }, [highlights]);

  useEffect(() => {
    const parsed = parseISODate(value);
    if (!parsed) {
      return;
    }
    setVisibleMonth((prev) => {
      if (
        prev.getFullYear() === parsed.getFullYear() &&
        prev.getMonth() === parsed.getMonth()
      ) {
        return prev;
      }
      return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
    });
  }, [value]);

  const monthLabel = useMemo(
    () =>
      visibleMonth.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric"
      }),
    [visibleMonth]
  );

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  const selectedIso = value || "";

  const handlePreviousMonth = () => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleSelect = (iso) => {
    onChange(iso);
  };

  const handleDayPointerEnter = (iso, hasDue) => {
    if (typeof onHoverDate !== "function") {
      return;
    }
    if (hasDue) {
      onHoverDate(iso);
    } else {
      onHoverDate("");
    }
  };

  const handleGridPointerLeave = () => {
    if (typeof onHoverDate === "function") {
      onHoverDate("");
    }
  };

  return (
    <div className="calendar" aria-live="polite">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button type="button" onClick={handlePreviousMonth} aria-label="previous month">
            ‹
          </button>
          <button type="button" onClick={handleNextMonth} aria-label="next month">
            ›
          </button>
        </div>
        <span>{monthLabel}</span>
      </div>
      <div
        className="calendar-grid"
        role="grid"
        aria-label="select due date"
        onPointerLeave={handleGridPointerLeave}
      >
        {WEEKDAYS.map((day) => (
          <span key={day} className="calendar-weekday" aria-hidden="true">
            {day}
          </span>
        ))}
        {calendarDays.map(({ date, iso, inMonth }) => {
          const label = date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          });
          const isSelected = selectedIso === iso;
          const isToday = todayIso === iso;
          const highlight = highlightDetails.get(iso);
          const highlightPriorities = highlight?.priorities ?? [];
          const dueCount = highlight?.count ?? highlightPriorities.length;
          const classes = [
            "calendar-day",
            inMonth ? null : "outside",
            isSelected ? "selected" : null,
            isToday ? "today" : null,
            dueCount > 0 ? "has-due" : null
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={iso}
              type="button"
              className={classes}
              onClick={() => handleSelect(iso)}
              aria-pressed={isSelected}
              aria-label={`select ${label}${dueCount ? ` (${dueCount} task${dueCount > 1 ? "s" : ""} due)` : ""}`}
              onPointerEnter={() => handleDayPointerEnter(iso, dueCount > 0)}
              onFocus={() => handleDayPointerEnter(iso, dueCount > 0)}
              onBlur={(event) => {
                if (typeof onHoverDate !== "function") {
                  return;
                }
                const nextTarget = event.relatedTarget;
                if (
                  nextTarget &&
                  typeof nextTarget.closest === "function" &&
                  nextTarget.closest(".calendar-day")
                ) {
                  return;
                }
                onHoverDate("");
              }}
            >
              <span className="calendar-day-number">{date.getDate()}</span>
              {dueCount > 0 ? (
                <span
                  className="calendar-indicators"
                  aria-hidden="true"
                  title={`${dueCount} task${dueCount > 1 ? "s" : ""} due`}
                >
                  {(highlightPriorities.length
                    ? highlightPriorities
                    : Array.from({ length: dueCount }, () => "medium")
                  ).map((priority, index) => (
                    <span
                      key={`${iso}-${index}`}
                      className={`calendar-indicator priority-${priority}`}
                    />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <span className="calendar-sr-only">Use the buttons to move between months and choose a due date.</span>
    </div>
  );
}

CalendarPicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  highlights: PropTypes.object,
  onHoverDate: PropTypes.func
};

export default CalendarPicker;
