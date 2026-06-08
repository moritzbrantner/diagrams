"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  DiagramSvgItemInteraction,
  type DiagramItemAction,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getAutoGridPosition,
  getHullRoute,
  getNearestDiagramItem,
  getReactNodeAccessibleName,
  getSpatialBounds,
  isActivationKey,
  pointsToPath,
  type DiagramPoint,
  type DiagramTone,
  useControlledSetState,
} from "./diagram-utils";

export type EntityRelationshipField = {
  id: string;
  name: React.ReactNode;
  type?: React.ReactNode;
  key?: "primary" | "foreign" | "unique";
  nullable?: boolean;
};

export type EntityRelationshipEntity = {
  id: string;
  name: React.ReactNode;
  fields?: readonly EntityRelationshipField[];
  x?: number;
  y?: number;
  width?: number;
  tone?: DiagramTone;
};

export type EntityRelationshipCardinality = "one" | "zero-or-one" | "many" | "zero-or-many";

export type EntityRelationshipRelation = {
  id: string;
  source: string;
  target: string;
  label?: React.ReactNode;
  sourceCardinality?: EntityRelationshipCardinality;
  targetCardinality?: EntityRelationshipCardinality;
  identifying?: boolean;
  points?: readonly DiagramPoint[];
  waypoints?: readonly DiagramPoint[];
};

export type EntityRelationshipEntityAction = DiagramItemAction<PositionedEntityRelationshipEntity>;

export type EntityRelationshipDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  entities: readonly EntityRelationshipEntity[];
  relations?: readonly EntityRelationshipRelation[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
  selectedEntityId?: string | null;
  focusedEntityId?: string | null;
  defaultFocusedEntityId?: string | null;
  keyboardMode?: "nodes" | "none";
  getEntityDisabled?: (entity: PositionedEntityRelationshipEntity) => boolean;
  renderEntitySelection?: (entity: PositionedEntityRelationshipEntity) => React.ReactNode;
  entityActions?:
    | readonly EntityRelationshipEntityAction[]
    | ((entity: PositionedEntityRelationshipEntity) => readonly EntityRelationshipEntityAction[]);
  onEntitySelect?: (entity: PositionedEntityRelationshipEntity) => void;
  onEntityDeselect?: () => void;
  onFocusedEntityIdChange?: (entity: PositionedEntityRelationshipEntity | null) => void;
  onEntityActionSelect?: (
    action: EntityRelationshipEntityAction,
    entity: PositionedEntityRelationshipEntity,
  ) => void;
  selectedFieldId?: string | null;
  onFieldSelect?: (
    entity: PositionedEntityRelationshipEntity,
    field: EntityRelationshipField,
  ) => void;
  collapsedEntityIds?: readonly string[];
  defaultCollapsedEntityIds?: readonly string[];
  onCollapsedEntityIdsChange?: (
    entityIds: string[],
    entity: PositionedEntityRelationshipEntity,
    collapsed: boolean,
  ) => void;
};

type PositionedEntityRelationshipEntity = EntityRelationshipEntity &
  Required<Pick<EntityRelationshipEntity, "x" | "y">> & {
    width: number;
    height: number;
  };

const ENTITY_WIDTH = 232;
const HEADER_HEIGHT = 42;
const FIELD_HEIGHT = 28;

function EntityRelationshipDiagram({
  entities,
  relations = [],
  ariaLabel = "Entity relationship diagram",
  caption,
  emptyMessage = "No entities to display.",
  padding = 32,
  autoLayoutColumns = 3,
  selectedEntityId,
  focusedEntityId,
  defaultFocusedEntityId,
  keyboardMode,
  getEntityDisabled,
  renderEntitySelection,
  entityActions,
  onEntitySelect,
  onEntityDeselect,
  onFocusedEntityIdChange,
  onEntityActionSelect,
  selectedFieldId,
  onFieldSelect,
  collapsedEntityIds,
  defaultCollapsedEntityIds,
  onCollapsedEntityIdsChange,
  className,
  ...props
}: EntityRelationshipDiagramProps) {
  const positionedEntities = React.useMemo(
    () => positionEntities(entities, autoLayoutColumns),
    [autoLayoutColumns, entities],
  );
  const [internalCollapsedEntityIds, setInternalCollapsedEntityIds] = useControlledSetState({
    value: collapsedEntityIds,
    defaultValue: defaultCollapsedEntityIds,
  });
  const renderEntities = React.useMemo(
    () =>
      positionedEntities.map((entity) =>
        internalCollapsedEntityIds.has(entity.id)
          ? {
              ...entity,
              height: HEADER_HEIGHT + FIELD_HEIGHT,
            }
          : entity,
      ),
    [internalCollapsedEntityIds, positionedEntities],
  );
  const entityMap = React.useMemo(
    () => new Map(renderEntities.map((entity) => [entity.id, entity])),
    [renderEntities],
  );
  const validRelations = relations.filter(
    (relation) => entityMap.has(relation.source) && entityMap.has(relation.target),
  );
  const resolvedKeyboardMode =
    keyboardMode ?? (onEntitySelect || entityActions || onFieldSelect ? "nodes" : "none");
  const entityRefs = React.useRef(new Map<string, SVGGElement>());
  const [internalFocusedEntityId, setInternalFocusedEntityId] = React.useState<string | null>(
    () => defaultFocusedEntityId ?? null,
  );
  const enabledEntities = React.useMemo(
    () => renderEntities.filter((entity) => !getEntityDisabled?.(entity)),
    [getEntityDisabled, renderEntities],
  );
  const requestedFocusedEntityId =
    focusedEntityId !== undefined ? focusedEntityId : internalFocusedEntityId;
  const effectiveFocusedEntityId =
    resolvedKeyboardMode === "nodes"
      ? (enabledEntities.find((entity) => entity.id === requestedFocusedEntityId)?.id ??
        enabledEntities[0]?.id ??
        null)
      : null;
  const setEntityRef = React.useCallback((entityId: string, element: SVGGElement | null) => {
    if (element) {
      entityRefs.current.set(entityId, element);
    } else {
      entityRefs.current.delete(entityId);
    }
  }, []);
  const focusEntityById = React.useCallback(
    (entityId: string | null) => {
      const nextEntity = entityId ? (entityMap.get(entityId) ?? null) : null;

      if (focusedEntityId === undefined) {
        setInternalFocusedEntityId(entityId);
      }

      onFocusedEntityIdChange?.(nextEntity);

      if (entityId) {
        queueMicrotask(() => entityRefs.current.get(entityId)?.focus());
      }
    },
    [entityMap, focusedEntityId, onFocusedEntityIdChange],
  );
  const handleEntityFocus = React.useCallback(
    (entity: PositionedEntityRelationshipEntity) => {
      if (getEntityDisabled?.(entity)) {
        return;
      }

      if (focusedEntityId === undefined) {
        setInternalFocusedEntityId(entity.id);
      }

      onFocusedEntityIdChange?.(entity);
    },
    [focusedEntityId, getEntityDisabled, onFocusedEntityIdChange],
  );
  const handleEntityKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGGElement>, entity: PositionedEntityRelationshipEntity) => {
      if (resolvedKeyboardMode === "none" || getEntityDisabled?.(entity)) {
        return;
      }

      if (isActivationKey(event)) {
        event.preventDefault();
        onEntitySelect?.(entity);
        return;
      }

      if (event.key === "Escape") {
        if (selectedEntityId != null && onEntityDeselect) {
          event.preventDefault();
          onEntityDeselect();
        }
        return;
      }

      if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp"
      ) {
        return;
      }

      event.preventDefault();
      const nextEntity = getNearestDiagramItem(
        entity,
        enabledEntities.filter((item) => item.id !== entity.id),
        event.key,
      );

      if (nextEntity) {
        focusEntityById(nextEntity.id);
      }
    },
    [
      enabledEntities,
      focusEntityById,
      getEntityDisabled,
      onEntityDeselect,
      onEntitySelect,
      resolvedKeyboardMode,
      selectedEntityId,
    ],
  );
  const toggleEntity = React.useCallback(
    (entity: PositionedEntityRelationshipEntity, collapsed: boolean) => {
      const nextEntityIds = collapsed
        ? Array.from(new Set([...internalCollapsedEntityIds, entity.id]))
        : Array.from(internalCollapsedEntityIds).filter((id) => id !== entity.id);

      setInternalCollapsedEntityIds(nextEntityIds);
      onCollapsedEntityIdsChange?.(nextEntityIds, entity, collapsed);
    },
    [internalCollapsedEntityIds, onCollapsedEntityIdsChange, setInternalCollapsedEntityIds],
  );
  const routePoints = validRelations.flatMap((relation, index) => {
    const source = entityMap.get(relation.source);
    const target = entityMap.get(relation.target);

    return source && target
      ? getHullRoute({
          source,
          target,
          edgeIndex: index,
          obstacles: renderEntities,
          points: relation.points,
          waypoints: relation.waypoints,
          selfLoop: source.id === target.id,
        }).points
      : [];
  });
  const bounds = getSpatialBounds(renderEntities, routePoints);
  const viewBox = `${bounds.x - padding} ${bounds.y - padding} ${bounds.width + padding * 2} ${
    bounds.height + padding * 2
  }`;

  return (
    <figure
      data-slot="entity-relationship-diagram"
      className={cn(
        "grid min-w-0 gap-2 overflow-hidden rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="entity-relationship-diagram-scroll-area"
        role="region"
        aria-label={`${ariaLabel} scroll area`}
        className="overflow-auto"
      >
        <button type="button" className="sr-only">
          Focus entity relationship diagram scroll area
        </button>
        <svg
          data-slot="entity-relationship-diagram-svg"
          role={onEntitySelect || entityActions || onFieldSelect ? "group" : "img"}
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-80 w-full min-w-160 text-foreground"
        >
          {renderEntities.length ? (
            <>
              <g data-slot="entity-relationship-diagram-relations">
                {validRelations.map((relation, index) => (
                  <RelationShape
                    key={relation.id}
                    relation={relation}
                    entities={entityMap}
                    obstacles={renderEntities}
                    relationIndex={index}
                  />
                ))}
              </g>
              <g data-slot="entity-relationship-diagram-entities">
                {renderEntities.map((entity) => (
                  <DiagramSvgItemInteraction
                    key={entity.id}
                    item={entity}
                    slot="entity-relationship-diagram-entity"
                    accessibleName={getReactNodeAccessibleName(entity.name, entity.id)}
                    selected={selectedEntityId === entity.id}
                    focused={effectiveFocusedEntityId === entity.id}
                    disabled={Boolean(getEntityDisabled?.(entity))}
                    keyboardMode={resolvedKeyboardMode}
                    actions={
                      typeof entityActions === "function"
                        ? entityActions(entity)
                        : (entityActions ?? [])
                    }
                    renderSelection={(item) => renderEntitySelection?.(item)}
                    onSelect={onEntitySelect ? (item) => onEntitySelect(item) : undefined}
                    onFocus={handleEntityFocus}
                    onKeyDown={handleEntityKeyDown}
                    onActionSelect={onEntityActionSelect}
                    setItemRef={setEntityRef}
                  >
                    <EntityShape
                      entity={entity}
                      collapsed={internalCollapsedEntityIds.has(entity.id)}
                      selectedFieldId={selectedFieldId}
                      onFieldSelect={onFieldSelect}
                    />
                    {onCollapsedEntityIdsChange ||
                    collapsedEntityIds ||
                    defaultCollapsedEntityIds ? (
                      <foreignObject
                        x={entity.x + entity.width - 64}
                        y={entity.y + 8}
                        width={56}
                        height={28}
                      >
                        <button
                          type="button"
                          data-slot="entity-relationship-diagram-entity-action"
                          aria-label={`${internalCollapsedEntityIds.has(entity.id) ? "Expand" : "Collapse"} entity`}
                          className="inline-flex h-7 items-center rounded-sm border bg-background/90 px-2 text-xs font-medium shadow-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleEntity(entity, !internalCollapsedEntityIds.has(entity.id));
                          }}
                        >
                          {internalCollapsedEntityIds.has(entity.id) ? "Show" : "Hide"}
                        </button>
                      </foreignObject>
                    ) : null}
                  </DiagramSvgItemInteraction>
                ))}
              </g>
            </>
          ) : (
            <text
              x={bounds.x + bounds.width / 2}
              y={bounds.y + bounds.height / 2}
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

function RelationShape({
  relation,
  entities,
  obstacles,
  relationIndex,
}: {
  relation: EntityRelationshipRelation;
  entities: Map<string, PositionedEntityRelationshipEntity>;
  obstacles: readonly PositionedEntityRelationshipEntity[];
  relationIndex: number;
}) {
  const source = entities.get(relation.source);
  const target = entities.get(relation.target);

  if (!source || !target) {
    return null;
  }

  const route = getHullRoute({
    source,
    target,
    edgeIndex: relationIndex,
    obstacles,
    points: relation.points,
    waypoints: relation.waypoints,
    selfLoop: source.id === target.id,
  });
  const points = route.points;
  const start = points[0];
  const end = points[points.length - 1];
  const labelPoint = route.labelPoint ?? points[Math.floor(points.length / 2)] ?? start;

  return (
    <g
      data-slot="entity-relationship-diagram-relation"
      data-identifying={relation.identifying ? "true" : undefined}
    >
      <path
        d={pointsToPath(points)}
        fill="none"
        strokeWidth={2}
        strokeDasharray={relation.identifying ? undefined : "6 6"}
        className={defaultEdgeToneClasses.default}
      />
      {start ? (
        <text x={start.x + 8} y={start.y - 8} className="fill-muted-foreground text-xs">
          {formatCardinality(relation.sourceCardinality)}
        </text>
      ) : null}
      {end ? (
        <text x={end.x - 28} y={end.y - 8} className="fill-muted-foreground text-xs">
          {formatCardinality(relation.targetCardinality)}
        </text>
      ) : null}
      {relation.label && labelPoint ? (
        <foreignObject x={labelPoint.x - 70} y={labelPoint.y - 22} width={140} height={32}>
          <div className="inline-flex max-w-36 rounded-md border bg-background px-2 py-1 text-center text-xs text-muted-foreground shadow-sm">
            {relation.label}
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

function EntityShape({
  entity,
  collapsed,
  selectedFieldId,
  onFieldSelect,
}: {
  entity: PositionedEntityRelationshipEntity;
  collapsed: boolean;
  selectedFieldId?: string | null;
  onFieldSelect?: EntityRelationshipDiagramProps["onFieldSelect"];
}) {
  return (
    <foreignObject
      data-slot="entity-relationship-diagram-entity"
      x={entity.x}
      y={entity.y}
      width={entity.width}
      height={entity.height}
    >
      <div
        data-entity-id={entity.id}
        data-tone={entity.tone ?? "default"}
        className={cn(
          "grid size-full overflow-hidden rounded-md border text-sm shadow-sm",
          defaultToneClasses[entity.tone ?? "default"],
        )}
      >
        <div className="border-b bg-muted/40 px-3 py-2 font-medium leading-5">{entity.name}</div>
        <div className="grid">
          {collapsed ? (
            <div className="px-3 py-1.5 text-xs text-muted-foreground">
              {(entity.fields ?? []).length} fields hidden
            </div>
          ) : (
            (entity.fields ?? []).map((field) => (
              <div
                key={field.id}
                data-slot="entity-relationship-diagram-field"
                data-field-id={field.id}
                data-key={field.key}
                data-selected={selectedFieldId === field.id ? "true" : undefined}
                role={onFieldSelect ? "button" : undefined}
                tabIndex={onFieldSelect ? 0 : undefined}
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 border-b px-3 py-1.5 text-xs outline-none last:border-b-0",
                  selectedFieldId === field.id && "bg-primary/10",
                  onFieldSelect && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50",
                )}
                onClick={
                  onFieldSelect
                    ? (event) => {
                        event.stopPropagation();
                        onFieldSelect(entity, field);
                      }
                    : undefined
                }
                onKeyDown={
                  onFieldSelect
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          onFieldSelect(entity, field);
                        }
                      }
                    : undefined
                }
              >
                <span className="font-medium text-muted-foreground">
                  {field.key ? field.key.toUpperCase() : ""}
                </span>
                <span className="truncate">{field.name}</span>
                <span className="text-muted-foreground">
                  {field.type}
                  {field.nullable ? "?" : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </foreignObject>
  );
}

function positionEntities(
  entities: readonly EntityRelationshipEntity[],
  columns: number,
): PositionedEntityRelationshipEntity[] {
  return entities.map((entity, index) => {
    const fieldCount = entity.fields?.length ?? 0;
    const height = HEADER_HEIGHT + Math.max(1, fieldCount) * FIELD_HEIGHT;
    const fallback = getAutoGridPosition(
      index,
      columns,
      { x: 104, y: 88 },
      { width: ENTITY_WIDTH, height },
    );

    return {
      ...entity,
      x: clampFiniteNumber(entity.x, fallback.x),
      y: clampFiniteNumber(entity.y, fallback.y),
      width: Math.max(180, clampFiniteNumber(entity.width, ENTITY_WIDTH)),
      height,
    };
  });
}

function formatCardinality(cardinality: EntityRelationshipCardinality | undefined) {
  switch (cardinality) {
    case "one":
      return "1";
    case "zero-or-one":
      return "0..1";
    case "many":
      return "*";
    case "zero-or-many":
      return "0..*";
    default:
      return "";
  }
}

export { EntityRelationshipDiagram };
export type {
  DiagramPoint as EntityRelationshipDiagramPoint,
  DiagramTone as EntityRelationshipDiagramTone,
  PositionedEntityRelationshipEntity,
};
