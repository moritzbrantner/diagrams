"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  type DiagramDirection,
  type DiagramTone,
} from "./diagram-utils";

export type SequenceDiagramParticipant = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  tone?: DiagramTone;
  width?: number;
};

export type SequenceDiagramMessageKind = "sync" | "async" | "return" | "event";

export type SequenceDiagramMessage = {
  id: string;
  from: string;
  to: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  kind?: SequenceDiagramMessageKind;
  direction?: DiagramDirection;
};

export type SequenceDiagramActivation = {
  id: string;
  participantId: string;
  startMessageId: string;
  endMessageId: string;
  tone?: DiagramTone;
};

export type SequenceDiagramNote = {
  id: string;
  participantId: string;
  messageId?: string;
  label: React.ReactNode;
  tone?: DiagramTone;
};

export type SequenceDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  participants: readonly SequenceDiagramParticipant[];
  messages?: readonly SequenceDiagramMessage[];
  activations?: readonly SequenceDiagramActivation[];
  notes?: readonly SequenceDiagramNote[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
};

type PositionedParticipant = SequenceDiagramParticipant & {
  x: number;
  width: number;
};

const PARTICIPANT_GAP = 92;
const HEADER_HEIGHT = 84;
const MESSAGE_GAP = 72;
const TOP_PADDING = 24;
const LEFT_PADDING = 32;

function SequenceDiagram({
  participants,
  messages = [],
  activations = [],
  notes = [],
  ariaLabel = "Sequence diagram",
  caption,
  emptyMessage = "No sequence participants.",
  padding = 32,
  className,
  ...props
}: SequenceDiagramProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const positionedParticipants = React.useMemo(
    () => positionParticipants(participants),
    [participants],
  );
  const participantMap = React.useMemo(
    () => new Map(positionedParticipants.map((participant) => [participant.id, participant])),
    [positionedParticipants],
  );
  const validMessages = messages.filter(
    (message) => participantMap.has(message.from) && participantMap.has(message.to),
  );
  const messageY = React.useMemo(
    () =>
      new Map(
        validMessages.map((message, index) => [
          message.id,
          TOP_PADDING + HEADER_HEIGHT + 40 + index * MESSAGE_GAP,
        ]),
      ),
    [validMessages],
  );
  const width =
    positionedParticipants.length > 0
      ? Math.max(
          640,
          positionedParticipants[positionedParticipants.length - 1].x +
            positionedParticipants[positionedParticipants.length - 1].width +
            LEFT_PADDING,
        )
      : 640;
  const height = Math.max(
    260,
    TOP_PADDING + HEADER_HEIGHT + validMessages.length * MESSAGE_GAP + 96,
  );
  const markerId = `sequence-diagram-arrow-${markerPrefix}`;

  return (
    <figure
      data-slot="sequence-diagram"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="sequence-diagram-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus sequence diagram scroll area
        </button>
        <svg
          data-slot="sequence-diagram-svg"
          role="img"
          aria-label={ariaLabel}
          viewBox={`${-padding} ${-padding} ${width + padding * 2} ${height + padding * 2}`}
          className="block min-h-80 w-full min-w-160 text-foreground"
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-current text-muted-foreground" />
            </marker>
          </defs>
          {positionedParticipants.length ? (
            <>
              <g data-slot="sequence-diagram-participants">
                {positionedParticipants.map((participant) => (
                  <ParticipantShape
                    key={participant.id}
                    participant={participant}
                    height={height}
                  />
                ))}
              </g>
              <g data-slot="sequence-diagram-activations">
                {activations.map((activation) => (
                  <ActivationShape
                    key={activation.id}
                    activation={activation}
                    participants={participantMap}
                    messageY={messageY}
                  />
                ))}
              </g>
              <g data-slot="sequence-diagram-messages">
                {validMessages.map((message) => (
                  <MessageShape
                    key={message.id}
                    message={message}
                    participants={participantMap}
                    y={messageY.get(message.id) ?? HEADER_HEIGHT}
                    markerId={markerId}
                  />
                ))}
              </g>
              <g data-slot="sequence-diagram-notes">
                {notes.map((note, index) => (
                  <NoteShape
                    key={note.id}
                    note={note}
                    participants={participantMap}
                    messageY={messageY}
                    fallbackY={TOP_PADDING + HEADER_HEIGHT + 24 + index * 56}
                  />
                ))}
              </g>
            </>
          ) : (
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-sm"
            >
              {emptyMessage}
            </text>
          )}
        </svg>
      </div>
      {caption ? (
        <figcaption className="border-t px-3 py-2 text-xs leading-5 text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ParticipantShape({
  participant,
  height,
}: {
  participant: PositionedParticipant;
  height: number;
}) {
  const centerX = participant.x + participant.width / 2;

  return (
    <g data-slot="sequence-diagram-participant" data-participant-id={participant.id}>
      <line
        x1={centerX}
        x2={centerX}
        y1={TOP_PADDING + HEADER_HEIGHT}
        y2={height - 24}
        strokeDasharray="6 6"
        className={defaultEdgeToneClasses.muted}
      />
      <foreignObject
        x={participant.x}
        y={TOP_PADDING}
        width={participant.width}
        height={HEADER_HEIGHT}
      >
        <div
          data-tone={participant.tone ?? "default"}
          className={cn(
            "grid size-full content-center gap-1 rounded-md border p-3 text-center text-sm shadow-sm",
            defaultToneClasses[participant.tone ?? "default"],
          )}
        >
          <div className="font-medium leading-5">{participant.label}</div>
          {participant.description ? (
            <div className="text-xs text-muted-foreground">{participant.description}</div>
          ) : null}
        </div>
      </foreignObject>
    </g>
  );
}

function MessageShape({
  message,
  participants,
  y,
  markerId,
}: {
  message: SequenceDiagramMessage;
  participants: Map<string, PositionedParticipant>;
  y: number;
  markerId: string;
}) {
  const from = participants.get(message.from);
  const to = participants.get(message.to);

  if (!from || !to) {
    return null;
  }

  const x1 = from.x + from.width / 2;
  const x2 = to.x + to.width / 2;
  const direction = message.direction ?? "forward";
  const markerUrl = `url(#${markerId})`;

  return (
    <g data-slot="sequence-diagram-message" data-kind={message.kind ?? "sync"}>
      <line
        x1={x1}
        x2={x2}
        y1={y}
        y2={y}
        strokeWidth={2}
        strokeDasharray={message.kind === "return" || message.kind === "async" ? "6 6" : undefined}
        className={
          message.kind === "event" ? defaultEdgeToneClasses.success : defaultEdgeToneClasses.default
        }
        markerStart={direction === "backward" || direction === "both" ? markerUrl : undefined}
        markerEnd={direction === "forward" || direction === "both" ? markerUrl : undefined}
      />
      <foreignObject x={(x1 + x2) / 2 - 90} y={y - 42} width={180} height={38}>
        <div className="grid rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
          <span className="font-medium text-foreground">{message.label}</span>
          {message.description ? <span>{message.description}</span> : null}
        </div>
      </foreignObject>
    </g>
  );
}

function ActivationShape({
  activation,
  participants,
  messageY,
}: {
  activation: SequenceDiagramActivation;
  participants: Map<string, PositionedParticipant>;
  messageY: Map<string, number>;
}) {
  const participant = participants.get(activation.participantId);
  const startY = messageY.get(activation.startMessageId);
  const endY = messageY.get(activation.endMessageId);

  if (!participant || startY === undefined || endY === undefined) {
    return null;
  }

  return (
    <rect
      data-slot="sequence-diagram-activation"
      x={participant.x + participant.width / 2 - 7}
      y={Math.min(startY, endY)}
      width={14}
      height={Math.max(18, Math.abs(endY - startY))}
      rx={4}
      className={cn(
        "stroke-border",
        activation.tone === "danger" ? "fill-destructive/20" : "fill-primary/10",
      )}
    />
  );
}

function NoteShape({
  note,
  participants,
  messageY,
  fallbackY,
}: {
  note: SequenceDiagramNote;
  participants: Map<string, PositionedParticipant>;
  messageY: Map<string, number>;
  fallbackY: number;
}) {
  const participant = participants.get(note.participantId);

  if (!participant) {
    return null;
  }

  return (
    <foreignObject
      data-slot="sequence-diagram-note"
      x={participant.x + participant.width / 2 + 18}
      y={(note.messageId ? messageY.get(note.messageId) : fallbackY) ?? fallbackY}
      width={156}
      height={56}
    >
      <div
        data-tone={note.tone ?? "warning"}
        className={cn(
          "grid size-full content-center rounded-md border p-2 text-xs shadow-sm",
          defaultToneClasses[note.tone ?? "warning"],
        )}
      >
        {note.label}
      </div>
    </foreignObject>
  );
}

function positionParticipants(
  participants: readonly SequenceDiagramParticipant[],
): PositionedParticipant[] {
  let cursor = LEFT_PADDING;

  return participants.map((participant) => {
    const width = Math.max(132, clampFiniteNumber(participant.width, 168));
    const positioned = { ...participant, x: cursor, width };
    cursor += width + PARTICIPANT_GAP;
    return positioned;
  });
}

export { SequenceDiagram };
export type { DiagramDirection as SequenceDiagramDirection, DiagramTone as SequenceDiagramTone };
