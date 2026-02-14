"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
    // Check if device has touch capability
    const checkTouch = () => {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is non-standard property
        navigator.msMaxTouchPoints > 0
      );
    };
    setIsTouchDevice(checkTouch());
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    // Hide default cursor globally
    document.body.style.cursor = "none";

    // Add global CSS to hide cursor everywhere
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after {
        cursor: none !important;
      }
      body, html {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    const moveCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const hideCursor = () => setIsVisible(false);
    const showCursor = () => setIsVisible(true);

    document.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseleave", hideCursor);
    document.addEventListener("mouseenter", showCursor);

    return () => {
      // Restore default cursor on cleanup
      document.body.style.cursor = "auto";
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      document.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseleave", hideCursor);
      document.removeEventListener("mouseenter", showCursor);
    };
  }, [isTouchDevice]);

  // Don't render until mounted on client
  if (!mounted || isTouchDevice) return null;

  return (
    <div
      className="pointer-events-none fixed z-9999 transition-opacity duration-150"
      style={{
        left: position.x - 6,
        top: position.y - 6,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div
        className={`h-3 w-3 rounded-full transition-all duration-150 ${
          theme === "dark" ? "bg-white/90 shadow-lg" : "bg-black/90 shadow-lg"
        }`}
        style={{
          boxShadow:
            theme === "dark"
              ? "0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
              : "0 0 0 1px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      />
    </div>
  );
}
