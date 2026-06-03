import type { Preview } from "@storybook/react-vite";

import "../examples/src/styles.css";

if (typeof document !== "undefined") {
  const style = document.createElement("style");

  style.textContent = `
    #storybook-root {
      font-family: "Liberation Sans", Arial, sans-serif;
    }

    #storybook-root svg text {
      font-family: "Liberation Sans", Arial, sans-serif;
    }

    #storybook-root *, #storybook-root *::before, #storybook-root *::after {
      animation-duration: 0.001ms !important;
      animation-delay: 0ms !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head.append(style);
}

const preview: Preview = {
  parameters: {
    a11y: {
      context: "#storybook-root",
      test: "error",
    },
    controls: {
      expanded: true,
    },
  },
};

export default preview;
