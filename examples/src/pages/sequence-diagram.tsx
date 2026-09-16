import { SequenceDiagram } from "@moritzbrantner/diagrams/sequence-diagram";
import { useState } from "react";

import { DiagramPageShell, getDiagramPage, renderDiagramPage } from "./shared";

import type { ComponentProps } from "react";

const page = getDiagramPage("sequence-diagram");

const participants = [
  { id: "client", label: "Client", description: "Browser" },
  { id: "api", label: "API", description: "Gateway", tone: "accent" },
  { id: "orders", label: "Orders", description: "Domain service" },
  { id: "payments", label: "Payments", description: "Provider" },
] satisfies ComponentProps<typeof SequenceDiagram>["participants"];

const messages = [
  { id: "request", from: "client", to: "api", label: "POST /orders" },
  { id: "command", from: "api", to: "orders", label: "Create order", kind: "async" },
  { id: "authorize", from: "orders", to: "payments", label: "Authorize card" },
  { id: "approved", from: "payments", to: "orders", label: "Approved", kind: "return" },
  { id: "accepted", from: "orders", to: "api", label: "Order accepted", kind: "return" },
  { id: "response", from: "api", to: "client", label: "202 Accepted", kind: "return" },
] satisfies ComponentProps<typeof SequenceDiagram>["messages"];

function SequenceInteractionExample() {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const activeMessage = messages[activeMessageIndex];

  return (
    <div className="grid min-w-0 gap-3">
      <div className="grid gap-3 rounded-md border bg-muted/30 p-3">
        <div className="grid gap-1">
          <h2 className="text-sm font-semibold">Trace playback</h2>
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            Step through the request as a trace. Selecting any message jumps the playhead to that
            point, while hover and focus can still preview another exchange.
          </p>
          <output className="text-xs text-muted-foreground" aria-live="polite" data-testid="sequence-playback-status">
            Step {activeMessageIndex + 1} of {messages.length}: {activeMessage?.label}
          </output>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="sequence-previous-step"
            disabled={activeMessageIndex === 0}
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            onClick={() => setActiveMessageIndex((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <input
            type="range"
            aria-label="Sequence playback step"
            min={1}
            max={messages.length}
            value={activeMessageIndex + 1}
            className="min-w-48 flex-1"
            onChange={(event) => setActiveMessageIndex(Number(event.target.value) - 1)}
          />
          <button
            type="button"
            data-testid="sequence-next-step"
            disabled={activeMessageIndex === messages.length - 1}
            className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            onClick={() =>
              setActiveMessageIndex((current) => Math.min(messages.length - 1, current + 1))
            }
          >
            Next
          </button>
        </div>
      </div>

      <SequenceDiagram
        ariaLabel={page.ariaLabel}
        participants={participants}
        messages={messages}
        interactiveFeatures={{ controls: "always", pathHighlight: true, viewport: true }}
        selectedMessageId={activeMessage?.id}
        highlightedElement={activeMessage ? { kind: "edge", id: activeMessage.id } : null}
        onMessageSelect={(message) => {
          const nextIndex = messages.findIndex((item) => item.id === message.id);
          if (nextIndex >= 0) {
            setActiveMessageIndex(nextIndex);
          }
        }}
      />
    </div>
  );
}

renderDiagramPage(
  <DiagramPageShell page={page}>
    <SequenceInteractionExample />
  </DiagramPageShell>,
);
