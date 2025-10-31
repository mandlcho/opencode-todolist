import { useCallback, useEffect, useMemo, useState } from "react";

const CATEGORY_STORAGE_KEY = "todo-react-app::categories";

const DEFAULT_CATEGORIES = [
  { id: "category-work", label: "work", color: "#2563eb", isDefault: true },
  { id: "category-personal", label: "personal", color: "#059669", isDefault: true },
  { id: "category-errands", label: "errands", color: "#d97706", isDefault: true },
  { id: "category-learning", label: "learning", color: "#9333ea", isDefault: true }
];

const CUSTOM_COLOR_PALETTE = [
  "#dc2626",
  "#0ea5e9",
  "#16a34a",
  "#f97316",
  "#6366f1",
  "#0891b2",
  "#84cc16",
  "#f59e0b",
  "#f472b6",
  "#facc15"
];

const fallbackColor = "#6b7280";

const normalizeCategory = (category, { isDefault = false } = {}) => {
  if (!category || typeof category !== "object") {
    return null;
  }
  const rawId = typeof category.id === "string" && category.id.trim();
  const rawLabel = typeof category.label === "string" && category.label.trim();
  if (!rawLabel) {
    return null;
  }
  const normalized = {
    id: rawId || `category-${rawLabel.toLowerCase()}`,
    label: rawLabel.toLowerCase(),
    color:
      typeof category.color === "string" && category.color.trim()
        ? category.color.trim()
        : fallbackColor,
    isDefault: isDefault || Boolean(category.isDefault),
    isCustom: Boolean(category.isCustom),
    createdAt:
      typeof category.createdAt === "string" ? category.createdAt : null
  };
  return normalized;
};

const readInitialCategories = () => {
  const defaults = DEFAULT_CATEGORIES.map((cat) =>
    normalizeCategory(cat, { isDefault: true })
  ).filter(Boolean);

  try {
    const raw = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaults;
    }
    const seenIds = new Set();
    const seenLabels = new Set();
    defaults.forEach((item) => {
      seenIds.add(item.id);
      seenLabels.add(item.label);
    });
    const custom = parsed
      .map((item) => normalizeCategory(item))
      .filter((item) => {
        if (!item) return false;
        if (seenIds.has(item.id) || seenLabels.has(item.label)) {
          return false;
        }
        seenIds.add(item.id);
        seenLabels.add(item.label);
        return true;
      });
    return [...defaults, ...custom];
  } catch (error) {
    console.warn("Failed to read categories from storage", error);
    return defaults;
  }
};

const safePersist = (categories) => {
  try {
    window.localStorage.setItem(
      CATEGORY_STORAGE_KEY,
      JSON.stringify(categories)
    );
  } catch (error) {
    console.warn("Failed to persist categories", error);
  }
};

export function useCategories() {
  const initialCategories = useMemo(() => readInitialCategories(), []);
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    safePersist(categories);
  }, [categories]);

  const addCategoryAndGet = useCallback(
    (label) => {
      let createdCategory = null;
      setCategories((prev) => {
        if (!label || typeof label !== "string") {
          return prev;
        }
        const normalizedLabel = label.trim().toLowerCase();
        if (!normalizedLabel) {
          return prev;
        }
        const existing = prev.find(
          (category) => category.label === normalizedLabel
        );
        if (existing) {
          createdCategory = existing;
          return prev;
        }
        const customCount = prev.filter((category) => !category.isDefault)
          .length;
        const color =
          CUSTOM_COLOR_PALETTE[customCount % CUSTOM_COLOR_PALETTE.length] ??
          fallbackColor;
        const nextCategory = {
          id: crypto.randomUUID(),
          label: normalizedLabel,
          color,
          isDefault: false,
          isCustom: true,
          createdAt: new Date().toISOString()
        };
        createdCategory = nextCategory;
        return [...prev, nextCategory];
      });
      return createdCategory;
    },
    []
  );

  const removeCategory = useCallback((categoryId) => {
    if (!categoryId) {
      return null;
    }
    let removedCategory = null;
    setCategories((prev) =>
      prev.filter((category) => {
        if (category.id === categoryId) {
          removedCategory = category;
          return false;
        }
        return true;
      })
    );
    return removedCategory;
  }, []);

  return {
    categories,
    addCategory: addCategoryAndGet,
    removeCategory
  };
}
