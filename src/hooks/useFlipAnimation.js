import { useCallback, useLayoutEffect, useRef } from "react";

const DEFAULT_EASING = "cubic-bezier(0.2, 0, 0.2, 1)";
const DEFAULT_DURATION = 220;
const raf =
  typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame.bind(window)
    : (callback) => setTimeout(callback, 16);

function measureNode(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return null;
  }
  return node.getBoundingClientRect();
}

export function useFlipAnimation({
  isEnabled = true,
  dependencyList = [],
  duration = DEFAULT_DURATION,
  easing = DEFAULT_EASING
} = {}) {
  const positionsRef = useRef(new Map());
  const nodesRef = useRef(new Map());

  const register = useCallback(
    (key) => (node) => {
      if (!key) {
        return;
      }
      if (node) {
        nodesRef.current.set(key, node);
      } else {
        nodesRef.current.delete(key);
        positionsRef.current.delete(key);
      }
    },
    []
  );

  useLayoutEffect(() => {
    if (!isEnabled) {
      positionsRef.current = new Map();
      return;
    }

    const nextPositions = new Map();
    nodesRef.current.forEach((node, key) => {
      const rect = measureNode(node);
      if (rect) {
        nextPositions.set(key, rect);
      }
    });

    nextPositions.forEach((rect, key) => {
      const previous = positionsRef.current.get(key);
      if (!previous) {
        return;
      }
      const deltaX = previous.left - rect.left;
      const deltaY = previous.top - rect.top;

      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
        return;
      }

      const node = nodesRef.current.get(key);
      if (!node) {
        return;
      }

      if (typeof node.animate === "function") {
        node.animate(
          [
            { transform: `translate(${deltaX}px, ${deltaY}px)` },
            { transform: "translate(0, 0)" }
          ],
          {
            duration,
            easing,
            fill: "both"
          }
        );
      } else {
        const previousTransition = node.style.transition;
        node.style.transition = `${previousTransition ? `${previousTransition}, ` : ""}transform ${duration}ms ${easing}`;
        node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        raf(() => {
          node.style.transform = "";
        });
        const handleTransitionEnd = (event) => {
          if (event.propertyName === "transform") {
            node.style.transition = previousTransition;
            node.removeEventListener("transitionend", handleTransitionEnd);
          }
        };
        node.addEventListener("transitionend", handleTransitionEnd);
      }
    });

    positionsRef.current = nextPositions;
  }, [isEnabled, duration, easing, ...dependencyList]);

  return register;
}

export default useFlipAnimation;
