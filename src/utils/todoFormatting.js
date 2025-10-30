import { TODO_PRIORITIES, DEFAULT_PRIORITY } from "../hooks/useTodos";

export const PRIORITY_OPTIONS = TODO_PRIORITIES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1)
}));

export const getNextPriority = (current) => {
  const index = TODO_PRIORITIES.indexOf(current);
  if (index === -1) {
    return DEFAULT_PRIORITY;
  }
  return TODO_PRIORITIES[(index + 1) % TODO_PRIORITIES.length];
};

export const formatTimestamp = (value) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch (error) {
    return value;
  }
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const formatDate = (value) => {
  if (!value) return "";
  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { dateStyle: "medium" });
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch (error) {
    return value;
  }
};
