"use client";

import * as React from "react";

import { cn } from "../internal/cn";

import {
  clampFiniteNumber,
  diagramCanvasLabelVisibilityClass,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getDiagramCanvasStyle,
  getReactNodeAccessibleName,
  isActivationKey,
  useDiagramCanvasInteractions,
  useDiagramCanvasSettings,
  type DiagramDirection,
  type DiagramInteractiveProps,
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

export type SequenceDiagramMessageAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (message: SequenceDiagramMessage) => void;
};

export type SequenceDiagramParticipantAction = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: (participant: PositionedParticipant) => void;
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
  selectedMessageId?: string | null;
  selectedParticipantId?: string | null;
  focusedMessageId?: string | null;
  focusedParticipantId?: string | null;
  defaultFocusedMessageId?: string | null;
  defaultFocusedParticipantId?: string | null;
  keyboardMode?: "nodes" | "none";
  getMessageDisabled?: (message: SequenceDiagramMessage) => boolean;
  getParticipantDisabled?: (participant: PositionedParticipant) => boolean;
  messageActions?:
    | readonly SequenceDiagramMessageAction[]
    | ((message: SequenceDiagramMessage) => readonly SequenceDiagramMessageAction[]);
  participantActions?:
    | readonly SequenceDiagramParticipantAction[]
    | ((participant: PositionedParticipant) => readonly SequenceDiagramParticipantAction[]);
  onMessageSelect?: (message: SequenceDiagramMessage) => void;
  onParticipantSelect?: (participant: PositionedParticipant) => void;
  onMessageActionSelect?: (
    action: SequenceDiagramMessageAction,
    message: SequenceDiagramMessage,
  ) => void;
  onParticipantActionSelect?: (
    action: SequenceDiagramParticipantAction,
    participant: PositionedParticipant,
  ) => void;
  hiddenParticipantIds?: readonly string[];
} & DiagramInteractiveProps<PositionedParticipant, SequenceDiagramMessage>;

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
  selectedMessageId,
  selectedParticipantId,
  focusedMessageId,
  focusedParticipantId,
  defaultFocusedMessageId,
  defaultFocusedParticipantId,
  keyboardMode,
  getMessageDisabled,
  getParticipantDisabled,
  messageActions,
  participantActions,
  onMessageSelect,
  onParticipantSelect,
  onMessageActionSelect,
  onParticipantActionSelect,
  hiddenParticipantIds,
  interactiveFeatures,
  viewport,
  defaultViewport,
  onViewportChange,
  highlightedElement,
  defaultHighlightedElement,
  onHighlightedElementChange,
  searchQuery,
  defaultSearchQuery,
  onSearchQueryChange,
  focusedSearchResult,
  onFocusedSearchResultChange,
  getSearchText,
  inspectedEdgeId,
  defaultInspectedEdgeId,
  onInspectedEdgeIdChange,
  renderEdgeInspector,
  className,
  ...props
}: SequenceDiagramProps) {
  const markerPrefix = React.useId().replace(/:/g, "");
  const {
    menu: canvasSettingsMenu,
    setScrollAreaElement: setCanvasSettingsScrollAreaElement,
    svgProps: canvasSettingsSvgProps,
  } = useDiagramCanvasSettings();
  const visibleParticipants = React.useMemo(
    () => participants.filter((participant) => !hiddenParticipantIds?.includes(participant.id)),
    [hiddenParticipantIds, participants],
  );
  const positionedParticipants = React.useMemo(
    () => positionParticipants(visibleParticipants),
    [visibleParticipants],
  );
  const participantMap = React.useMemo(
    () => new Map(positionedParticipants.map((participant) => [participant.id, participant])),
    [positionedParticipants],
  );
  const validMessages = messages.filter(
    (message) => participantMap.has(message.from) && participantMap.has(message.to),
  );
  const resolvedKeyboardMode =
    keyboardMode ??
    (onMessageSelect || onParticipantSelect || messageActions || participantActions
      ? "nodes"
      : "none");
  const messageRefs = React.useRef(new Map<string, SVGGElement>());
  const participantRefs = React.useRef(new Map<string, SVGGElement>());
  const [internalFocusedMessageId, setInternalFocusedMessageId] = React.useState<string | null>(
    () => defaultFocusedMessageId ?? null,
  );
  const [internalFocusedParticipantId, setInternalFocusedParticipantId] = React.useState<
    string | null
  >(() => defaultFocusedParticipantId ?? null);
  const enabledMessages = React.useMemo(
    () => validMessages.filter((message) => !getMessageDisabled?.(message)),
    [getMessageDisabled, validMessages],
  );
  const enabledParticipants = React.useMemo(
    () => positionedParticipants.filter((participant) => !getParticipantDisabled?.(participant)),
    [getParticipantDisabled, positionedParticipants],
  );
  const effectiveFocusedMessageId =
    resolvedKeyboardMode === "nodes"
      ? (enabledMessages.find(
          (message) =>
            message.id ===
            (focusedMessageId !== undefined ? focusedMessageId : internalFocusedMessageId),
        )?.id ??
        enabledMessages[0]?.id ??
        null)
      : null;
  const effectiveFocusedParticipantId =
    resolvedKeyboardMode === "nodes"
      ? (enabledParticipants.find(
          (participant) =>
            participant.id ===
            (focusedParticipantId !== undefined
              ? focusedParticipantId
              : internalFocusedParticipantId),
        )?.id ??
        enabledParticipants[0]?.id ??
        null)
      : null;
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
  const bounds = { x: 0, y: 0, width, height };
  const canvasStyle = getDiagramCanvasStyle(bounds, {
    minHeight: 320,
    minWidth: 640,
    padding,
  });
  const interaction = useDiagramCanvasInteractions({
    interactiveFeatures,
    contentBounds: bounds,
    nodes: positionedParticipants.map((participant) => ({
      id: participant.id,
      item: participant,
      label: participant.label,
      bounds: {
        x: participant.x,
        y: TOP_PADDING,
        width: participant.width,
        height: HEADER_HEIGHT,
      },
    })),
    edges: validMessages.map((message) => {
      const from = participantMap.get(message.from);
      const to = participantMap.get(message.to);
      const y = messageY.get(message.id) ?? HEADER_HEIGHT;
      const x1 = from ? from.x + from.width / 2 : 0;
      const x2 = to ? to.x + to.width / 2 : x1;

      return {
        id: message.id,
        item: message,
        sourceId: message.from,
        targetId: message.to,
        label: message.label,
        kind: message.kind,
        direction: message.direction,
        labelPoint: { x: (x1 + x2) / 2, y },
      };
    }),
    viewport,
    defaultViewport,
    onViewportChange,
    highlightedElement,
    defaultHighlightedElement,
    onHighlightedElementChange,
    searchQuery,
    defaultSearchQuery,
    onSearchQueryChange,
    focusedSearchResult,
    onFocusedSearchResultChange,
    inspectedEdgeId,
    defaultInspectedEdgeId,
    onInspectedEdgeIdChange,
    getSearchText,
    renderEdgeInspector,
    padding,
  });
  const setScrollAreaElement = React.useCallback(
    (element: HTMLDivElement | null) => {
      setCanvasSettingsScrollAreaElement(element);
      interaction.setScrollAreaElement(element);
    },
    [interaction, setCanvasSettingsScrollAreaElement],
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
        ref={setScrollAreaElement}
        data-slot="sequence-diagram-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="relative overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus sequence diagram scroll area
        </button>
        <svg
          {...canvasSettingsSvgProps}
          data-slot="sequence-diagram-svg"
          role={
            onMessageSelect || onParticipantSelect || messageActions || participantActions
              ? "group"
              : "img"
          }
          aria-label={ariaLabel}
          viewBox={interaction.viewBox}
          style={canvasStyle}
          className={cn(
            "block min-h-80 w-full min-w-160 text-foreground",
            diagramCanvasLabelVisibilityClass,
          )}
          {...interaction.svgProps}
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="10"
              markerUnits="userSpaceOnUse"
              refX="10"
              refY="5"
              orient="auto-start-reverse"
              viewBox="0 0 10 10"
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
                    selected={selectedParticipantId === participant.id}
                    focused={effectiveFocusedParticipantId === participant.id}
                    disabled={Boolean(getParticipantDisabled?.(participant))}
                    keyboardMode={resolvedKeyboardMode}
                    actions={
                      typeof participantActions === "function"
                        ? participantActions(participant)
                        : (participantActions ?? [])
                    }
                    onParticipantSelect={onParticipantSelect}
                    onParticipantActionSelect={onParticipantActionSelect}
                    onParticipantFocus={(item) => {
                      if (focusedParticipantId === undefined) {
                        setInternalFocusedParticipantId(item.id);
                      }
                    }}
                    onParticipantKeyDown={(event, item) => {
                      if (resolvedKeyboardMode === "none" || getParticipantDisabled?.(item)) {
                        return;
                      }
                      if (isActivationKey(event)) {
                        event.preventDefault();
                        onParticipantSelect?.(item);
                        return;
                      }
                      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                        return;
                      }
                      event.preventDefault();
                      const index = enabledParticipants.findIndex(
                        (participantItem) => participantItem.id === item.id,
                      );
                      const next =
                        event.key === "ArrowRight"
                          ? enabledParticipants[Math.min(enabledParticipants.length - 1, index + 1)]
                          : enabledParticipants[Math.max(0, index - 1)];
                      if (next) {
                        if (focusedParticipantId === undefined) {
                          setInternalFocusedParticipantId(next.id);
                        }
                        queueMicrotask(() => participantRefs.current.get(next.id)?.focus());
                      }
                    }}
                    setParticipantRef={(participantId, element) => {
                      if (element) {
                        participantRefs.current.set(participantId, element);
                      } else {
                        participantRefs.current.delete(participantId);
                      }
                      interaction.setNodeElement(participantId, element);
                    }}
                    highlightState={interaction.getNodeHighlightState(participant.id)}
                    interactionProps={interaction.getNodeInteractionProps(participant.id)}
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
                    selected={selectedMessageId === message.id}
                    focused={effectiveFocusedMessageId === message.id}
                    disabled={Boolean(getMessageDisabled?.(message))}
                    keyboardMode={resolvedKeyboardMode}
                    actions={
                      typeof messageActions === "function"
                        ? messageActions(message)
                        : (messageActions ?? [])
                    }
                    onMessageSelect={onMessageSelect}
                    onMessageActionSelect={onMessageActionSelect}
                    onMessageFocus={(item) => {
                      if (focusedMessageId === undefined) {
                        setInternalFocusedMessageId(item.id);
                      }
                    }}
                    onMessageKeyDown={(event, item) => {
                      if (resolvedKeyboardMode === "none" || getMessageDisabled?.(item)) {
                        return;
                      }
                      if (isActivationKey(event)) {
                        event.preventDefault();
                        onMessageSelect?.(item);
                        return;
                      }
                      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
                        return;
                      }
                      event.preventDefault();
                      const index = enabledMessages.findIndex(
                        (messageItem) => messageItem.id === item.id,
                      );
                      const next =
                        event.key === "ArrowDown"
                          ? enabledMessages[Math.min(enabledMessages.length - 1, index + 1)]
                          : enabledMessages[Math.max(0, index - 1)];
                      if (next) {
                        if (focusedMessageId === undefined) {
                          setInternalFocusedMessageId(next.id);
                        }
                        queueMicrotask(() => messageRefs.current.get(next.id)?.focus());
                      }
                    }}
                    setMessageRef={(messageId, element) => {
                      if (element) {
                        messageRefs.current.set(messageId, element);
                      } else {
                        messageRefs.current.delete(messageId);
                      }
                    }}
                    highlightState={interaction.getEdgeHighlightState(message.id)}
                    interactionProps={interaction.getEdgeInteractionProps(message.id)}
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
        {interaction.overlay}
        {canvasSettingsMenu}
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
  selected,
  focused,
  disabled,
  keyboardMode,
  actions,
  onParticipantSelect,
  onParticipantActionSelect,
  onParticipantFocus,
  onParticipantKeyDown,
  setParticipantRef,
  highlightState,
  interactionProps,
}: {
  participant: PositionedParticipant;
  height: number;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  keyboardMode: "nodes" | "none";
  actions: readonly SequenceDiagramParticipantAction[];
  onParticipantSelect?: SequenceDiagramProps["onParticipantSelect"];
  onParticipantActionSelect?: SequenceDiagramProps["onParticipantActionSelect"];
  onParticipantFocus: (participant: PositionedParticipant) => void;
  onParticipantKeyDown: (
    event: React.KeyboardEvent<SVGGElement>,
    participant: PositionedParticipant,
  ) => void;
  setParticipantRef: (participantId: string, element: SVGGElement | null) => void;
  highlightState?: "active" | "related" | "dimmed";
  interactionProps?: React.SVGProps<SVGGElement>;
}) {
  const centerX = participant.x + participant.width / 2;

  return (
    <g
      data-slot="sequence-diagram-participant"
      data-participant-id={participant.id}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      data-highlight-state={highlightState}
      role={onParticipantSelect && !actions.length ? "button" : undefined}
      aria-label={
        onParticipantSelect && !actions.length
          ? getReactNodeAccessibleName(participant.label, participant.id)
          : undefined
      }
      aria-pressed={onParticipantSelect && !actions.length ? selected : undefined}
      tabIndex={keyboardMode === "nodes" && focused && !disabled ? 0 : -1}
      className={cn(
        "outline-none",
        onParticipantSelect && "cursor-pointer",
        disabled && "opacity-60",
        "transition-opacity data-[highlight-state=related]:opacity-100 data-[disabled=true]:data-[highlight-state=related]:opacity-60 data-[highlight-state=dimmed]:opacity-25 data-[highlight-state=active]:[&_foreignObject>div]:ring-2 data-[highlight-state=active]:[&_foreignObject>div]:ring-ring/60",
      )}
      onClick={
        onParticipantSelect && !disabled ? () => onParticipantSelect(participant) : undefined
      }
      onPointerEnter={interactionProps?.onPointerEnter}
      onPointerLeave={interactionProps?.onPointerLeave}
      onFocus={(event) => {
        interactionProps?.onFocus?.(event);
        onParticipantFocus(participant);
      }}
      onBlur={interactionProps?.onBlur}
      onKeyDown={(event) => {
        interactionProps?.onKeyDown?.(event);
        onParticipantKeyDown(event, participant);
      }}
      ref={(element) => setParticipantRef(participant.id, element)}
    >
      {selected || focused ? (
        <rect
          x={participant.x - 6}
          y={TOP_PADDING - 6}
          width={participant.width + 12}
          height={HEADER_HEIGHT + 12}
          rx={12}
          className={cn("fill-transparent stroke-2", selected ? "stroke-primary" : "stroke-ring")}
        />
      ) : null}
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
      {actions.length ? (
        <SequenceActions
          actions={actions}
          x={participant.x + participant.width - actions.length * 32 - 8}
          y={TOP_PADDING + HEADER_HEIGHT - 36}
          onAction={(action) => {
            action.onSelect?.(participant);
            onParticipantActionSelect?.(action, participant);
          }}
        />
      ) : null}
    </g>
  );
}

function MessageShape({
  message,
  participants,
  y,
  markerId,
  selected,
  focused,
  disabled,
  keyboardMode,
  actions,
  onMessageSelect,
  onMessageActionSelect,
  onMessageFocus,
  onMessageKeyDown,
  setMessageRef,
  highlightState,
  interactionProps,
}: {
  message: SequenceDiagramMessage;
  participants: Map<string, PositionedParticipant>;
  y: number;
  markerId: string;
  selected: boolean;
  focused: boolean;
  disabled: boolean;
  keyboardMode: "nodes" | "none";
  actions: readonly SequenceDiagramMessageAction[];
  onMessageSelect?: SequenceDiagramProps["onMessageSelect"];
  onMessageActionSelect?: SequenceDiagramProps["onMessageActionSelect"];
  onMessageFocus: (message: SequenceDiagramMessage) => void;
  onMessageKeyDown: (
    event: React.KeyboardEvent<SVGGElement>,
    message: SequenceDiagramMessage,
  ) => void;
  setMessageRef: (messageId: string, element: SVGGElement | null) => void;
  highlightState?: "active" | "related" | "dimmed";
  interactionProps?: React.SVGProps<SVGGElement>;
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
    <g
      data-diagram-edge="true"
      data-slot="sequence-diagram-message"
      data-kind={message.kind ?? "sync"}
      data-message-id={message.id}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      data-highlight-state={highlightState}
      role={onMessageSelect && !actions.length ? "button" : undefined}
      aria-label={
        onMessageSelect && !actions.length
          ? getReactNodeAccessibleName(message.label, message.id)
          : undefined
      }
      aria-pressed={onMessageSelect && !actions.length ? selected : undefined}
      aria-describedby={interactionProps?.["aria-describedby"]}
      tabIndex={
        keyboardMode === "nodes" && focused && !disabled ? 0 : (interactionProps?.tabIndex ?? -1)
      }
      className={cn(
        "outline-none transition-opacity data-[highlight-state=dimmed]:opacity-25",
        onMessageSelect && "cursor-pointer",
        disabled && "opacity-60",
      )}
      onClick={
        (onMessageSelect && !disabled) || interactionProps?.onClick
          ? (event) => {
              interactionProps?.onClick?.(event);
              if (onMessageSelect && !disabled) {
                onMessageSelect(message);
              }
            }
          : undefined
      }
      onPointerEnter={interactionProps?.onPointerEnter}
      onPointerLeave={interactionProps?.onPointerLeave}
      onFocus={(event) => {
        interactionProps?.onFocus?.(event);
        onMessageFocus(message);
      }}
      onBlur={interactionProps?.onBlur}
      onKeyDown={(event) => {
        interactionProps?.onKeyDown?.(event);
        onMessageKeyDown(event, message);
      }}
      ref={(element) => setMessageRef(message.id, element)}
    >
      {selected || focused ? (
        <rect
          x={Math.min(x1, x2) - 12}
          y={y - 48}
          width={Math.abs(x2 - x1) + 24}
          height={56}
          rx={10}
          className={cn("fill-transparent stroke-2", selected ? "stroke-primary" : "stroke-ring")}
        />
      ) : null}
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
      <foreignObject
        data-diagram-label="true"
        x={(x1 + x2) / 2 - 90}
        y={y - 42}
        width={180}
        height={38}
      >
        <div className="grid rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
          <span className="font-medium text-foreground">{message.label}</span>
          {message.description ? <span>{message.description}</span> : null}
        </div>
      </foreignObject>
      {actions.length ? (
        <SequenceActions
          actions={actions}
          x={(x1 + x2) / 2 + 94}
          y={y - 36}
          onAction={(action) => {
            action.onSelect?.(message);
            onMessageActionSelect?.(action, message);
          }}
        />
      ) : null}
    </g>
  );
}

function SequenceActions<
  TAction extends {
    id: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
    disabled?: boolean;
    destructive?: boolean;
  },
>({
  actions,
  x,
  y,
  onAction,
}: {
  actions: readonly TAction[];
  x: number;
  y: number;
  onAction: (action: TAction) => void;
}) {
  return (
    <foreignObject x={x} y={y} width={actions.length * 32} height={28}>
      <div className="flex gap-1">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            data-slot="sequence-diagram-action"
            data-action-id={action.id}
            disabled={action.disabled}
            aria-label={getReactNodeAccessibleName(action.label, action.id)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-sm border bg-background/90 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              action.destructive && "text-destructive",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onAction(action);
            }}
          >
            {action.icon ?? action.label}
          </button>
        ))}
      </div>
    </foreignObject>
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
      data-diagram-label="true"
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
export type {
  DiagramDirection as SequenceDiagramDirection,
  DiagramTone as SequenceDiagramTone,
  PositionedParticipant,
};
