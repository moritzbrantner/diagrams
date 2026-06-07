"use client";

import { cn } from "@moritzbrantner/ui";
import * as React from "react";

import {
  clampFiniteNumber,
  defaultEdgeToneClasses,
  defaultToneClasses,
  getAutoGridPosition,
  getOrthogonalRoute,
  getSpatialBounds,
  pointsToPath,
  type DiagramPoint,
  type DiagramTone,
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
};

export type EntityRelationshipDiagramProps = Omit<React.ComponentProps<"figure">, "children"> & {
  entities: readonly EntityRelationshipEntity[];
  relations?: readonly EntityRelationshipRelation[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  padding?: number;
  autoLayoutColumns?: number;
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
  className,
  ...props
}: EntityRelationshipDiagramProps) {
  const positionedEntities = React.useMemo(
    () => positionEntities(entities, autoLayoutColumns),
    [autoLayoutColumns, entities],
  );
  const entityMap = React.useMemo(
    () => new Map(positionedEntities.map((entity) => [entity.id, entity])),
    [positionedEntities],
  );
  const validRelations = relations.filter(
    (relation) => entityMap.has(relation.source) && entityMap.has(relation.target),
  );
  const routePoints = validRelations.flatMap((relation, index) =>
    relation.points?.length
      ? relation.points
      : getOrthogonalRoute(entityMap.get(relation.source)!, entityMap.get(relation.target)!, index),
  );
  const bounds = getSpatialBounds(positionedEntities, routePoints);
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
          role="img"
          aria-label={ariaLabel}
          viewBox={viewBox}
          className="block min-h-80 w-full min-w-160 text-foreground"
        >
          {positionedEntities.length ? (
            <>
              <g data-slot="entity-relationship-diagram-relations">
                {validRelations.map((relation, index) => (
                  <RelationShape
                    key={relation.id}
                    relation={relation}
                    entities={entityMap}
                    relationIndex={index}
                  />
                ))}
              </g>
              <g data-slot="entity-relationship-diagram-entities">
                {positionedEntities.map((entity) => (
                  <EntityShape key={entity.id} entity={entity} />
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
  relationIndex,
}: {
  relation: EntityRelationshipRelation;
  entities: Map<string, PositionedEntityRelationshipEntity>;
  relationIndex: number;
}) {
  const source = entities.get(relation.source);
  const target = entities.get(relation.target);

  if (!source || !target) {
    return null;
  }

  const points = relation.points?.length
    ? relation.points
    : getOrthogonalRoute(source, target, relationIndex);
  const start = points[0];
  const end = points[points.length - 1];
  const labelPoint = points[Math.floor(points.length / 2)] ?? start;

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

function EntityShape({ entity }: { entity: PositionedEntityRelationshipEntity }) {
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
          {(entity.fields ?? []).map((field) => (
            <div
              key={field.id}
              data-slot="entity-relationship-diagram-field"
              data-key={field.key}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2 border-b px-3 py-1.5 text-xs last:border-b-0"
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
          ))}
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
