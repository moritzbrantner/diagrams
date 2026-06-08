import { expect } from "storybook/test";

import { EntityRelationshipDiagram } from "../entity-relationship-diagram";
import { StoryFrame, type ComponentsStory } from "../testing/storybook";

import type { Meta } from "@storybook/react-vite";

const meta = {
  title: "Diagrams/Components",
  component: StoryFrame,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof StoryFrame>;

export default meta;

export const EntityRelationshipDiagramStory: ComponentsStory = {
  name: "Entity Relationship Diagram",
  render: () => (
    <StoryFrame>
      <EntityRelationshipDiagram
        ariaLabel="Story entity relationship diagram"
        entities={[
          {
            id: "orders",
            name: "orders",
            fields: [
              { id: "id", name: "id", type: "uuid", key: "primary" },
              { id: "customer_id", name: "customer_id", type: "uuid", key: "foreign" },
            ],
          },
          {
            id: "customers",
            name: "customers",
            x: 340,
            y: 80,
            fields: [{ id: "customer-id", name: "id", type: "uuid", key: "primary" }],
          },
        ]}
        relations={[
          {
            id: "customer-orders",
            source: "customers",
            target: "orders",
            label: "places",
            sourceCardinality: "one",
            targetCardinality: "zero-or-many",
          },
        ]}
      />
    </StoryFrame>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: "Story entity relationship diagram" }),
    ).toBeVisible();
    await expect(canvas.getByText("customer_id")).toBeVisible();
  },
};
