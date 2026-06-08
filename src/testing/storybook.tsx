import type { StoryObj } from "@storybook/react-vite";
import type React from "react";

export function StoryFrame({ children }: { children?: React.ReactNode }) {
  return <div className="mx-auto grid max-w-5xl gap-6 p-4">{children}</div>;
}

export type ComponentsStory = StoryObj<typeof StoryFrame>;
