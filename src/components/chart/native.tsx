"use client";

import * as React from "react";
import { cn } from "../../lib/cn";

const GRAPH_VIEWBOX = { width: 640, height: 320 } as const;
const GRAPH_PADDING = { top: 20, right: 24, bottom: 44, left: 48 } as const;
const GRAPH_SCROLL_POINT_WIDTH = 48;
const GRAPH_TOOLTIP_WIDTH = 184;
const GRAPH_TOOLTIP_ROW_HEIGHT = 22;
const SPARKLINE_VIEWBOX = { width: 240, height: 72 } as const;
const SPARKLINE_PADDING = 6;
const DONUT_VIEWBOX = 220;
type ChartDatumValue = number | string | null | undefined;

type ChartDatum = {
  [key: string]: ChartDatumValue | ChartDatum[];
};

type ChartSeries = {
  key: string;
  label?: React.ReactNode;
  color?: string;
  className?: string;
};

type ChartHistogramBin = {
  min: number;
  max: number;
  count: number;
  label?: React.ReactNode;
  color?: string;
  className?: string;
};

type ChartPretextItem = {
  id?: string;
  x: number | string;
  y: number | string;
  children: React.ReactNode;
  className?: string;
  textAnchor?: React.ComponentProps<"text">["textAnchor"];
  dominantBaseline?: React.ComponentProps<"text">["dominantBaseline"];
};

type ChartGraphProps = Omit<React.ComponentProps<"figure">, "children"> & {
  data: ChartDatum[];
  series: ChartSeries[];
  xKey?: string;
  ariaLabel?: string;
  caption?: React.ReactNode;
  summary?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  noDataReason?: React.ReactNode;
  height?: number;
  width?: number;
  yDomain?: [number, number];
  yTickCount?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showLegend?: boolean;
  interactive?: boolean;
  scrollable?: boolean;
  scrollPointWidth?: number;
  valueLabels?: boolean | "auto";
  onDatumFocus?: (datum: ChartDatum, index: number) => void;
  formatLabel?: (
    value: ChartDatumValue,
    datum: ChartDatum,
    index: number,
  ) => React.ReactNode;
  formatValue?: (value: number) => React.ReactNode;
  pretext?: ChartPretextItem[];
};

type ChartHistogramGraphProps = Omit<
  React.ComponentProps<"figure">,
  "children"
> & {
  data?: ChartHistogramBin[];
  values?: number[];
  bins?: number | number[];
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  height?: number;
  width?: number;
  xDomain?: [number, number];
  yDomain?: [number, number];
  yTickCount?: number;
  xTickCount?: number;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  interactive?: boolean;
  scrollable?: boolean;
  scrollBinWidth?: number;
  color?: string;
  countLabel?: React.ReactNode;
  formatBin?: (bin: ChartHistogramBin, index: number) => React.ReactNode;
  formatCount?: (value: number) => React.ReactNode;
  formatValue?: (value: number) => React.ReactNode;
};

type ChartSparklineProps = Omit<React.ComponentProps<"figure">, "children"> & {
  data: ChartDatum[];
  series: ChartSeries;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  height?: number;
  width?: number;
  yDomain?: [number, number];
  showArea?: boolean;
  showPoints?: boolean;
  formatValue?: (value: number) => React.ReactNode;
};

type ChartDonutGraphProps = Omit<React.ComponentProps<"figure">, "children"> & {
  data: ChartDatum[];
  valueKey?: string;
  labelKey?: string;
  ariaLabel?: string;
  caption?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showTotal?: boolean;
  centerLabel?: React.ReactNode | ((total: number) => React.ReactNode);
  childrenKey?: string;
  activePath?: readonly number[];
  defaultActivePath?: readonly number[];
  onActivePathChange?: (path: number[], datum: ChartDatum | null) => void;
  onSegmentSelect?: (datum: ChartDatum, index: number, path: number[]) => void;
  showBreadcrumbs?: boolean;
  renderBreadcrumb?: (
    item: ChartDonutBreadcrumbItem,
    index: number,
    items: ChartDonutBreadcrumbItem[],
  ) => React.ReactNode;
  focusedSegmentPath?: readonly number[] | null;
  defaultFocusedSegmentPath?: readonly number[] | null;
  onFocusedSegmentPathChange?: (
    path: number[] | null,
    datum: ChartDatum | null,
  ) => void;
  onDrillDown?: (datum: ChartDatum, path: number[]) => void;
  onDrillUp?: (path: number[], datum: ChartDatum | null) => void;
  formatLabel?: (
    value: ChartDatumValue,
    datum: ChartDatum,
    index: number,
  ) => React.ReactNode;
  formatValue?: (value: number) => React.ReactNode;
};

type ChartDonutBreadcrumbItem = {
  label: React.ReactNode;
  path: number[];
  datum: ChartDatum | null;
};

function ChartPretext({ className, ...props }: React.ComponentProps<"g">) {
  return (
    <g
      data-slot="chart-pretext"
      aria-hidden="true"
      className={cn(
        "pointer-events-none select-none fill-muted-foreground text-[10px] tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

function ChartPretextText({
  className,
  children,
  dominantBaseline = "middle",
  textAnchor = "middle",
  ...props
}: React.ComponentProps<"text">) {
  return (
    <text
      data-slot="chart-pretext-text"
      dominantBaseline={dominantBaseline}
      textAnchor={textAnchor}
      className={cn("font-medium", className)}
      {...props}
    >
      {children}
    </text>
  );
}

function ChartLineGraph(props: ChartGraphProps) {
  return (
    <ChartGraph graph="line" xScale="point" ariaLabel="Line chart" {...props} />
  );
}

function ChartAreaGraph(props: ChartGraphProps) {
  return (
    <ChartGraph
      graph="area"
      xScale="point"
      includeZero
      ariaLabel="Area chart"
      {...props}
    />
  );
}

function ChartBarGraph(props: ChartGraphProps) {
  return (
    <ChartGraph
      graph="bar"
      xScale="band"
      includeZero
      ariaLabel="Bar chart"
      {...props}
    />
  );
}

function ChartHistogramGraph({
  data,
  values,
  bins = 10,
  ariaLabel = "Histogram chart",
  caption,
  emptyMessage = "No histogram data.",
  height = GRAPH_VIEWBOX.height,
  width = GRAPH_VIEWBOX.width,
  xDomain,
  yDomain,
  yTickCount = 5,
  xTickCount = 6,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  interactive = true,
  scrollable,
  scrollBinWidth = GRAPH_SCROLL_POINT_WIDTH,
  color = "var(--chart-1)",
  countLabel = "Count",
  formatBin = defaultFormatHistogramBin,
  formatCount = defaultFormatValue,
  formatValue = defaultFormatValue,
  className,
  ...props
}: ChartHistogramGraphProps) {
  const histogramBins = React.useMemo(
    () => getHistogramBins({ data, values, bins, xDomain }),
    [data, values, bins, xDomain],
  );
  const hasData = histogramBins.length > 0;
  const shouldScroll = scrollable ?? histogramBins.length > 16;
  const chartWidth = shouldScroll
    ? Math.max(
        width,
        GRAPH_PADDING.left +
          GRAPH_PADDING.right +
          histogramBins.length * scrollBinWidth,
      )
    : width;
  const layout = getChartLayout({ width: chartWidth, height });
  const histogramXDomain = xDomain
    ? normalizeDomain(xDomain)
    : getHistogramXDomain(histogramBins);
  const histogramYDomain = yDomain
    ? normalizeDomain(yDomain)
    : normalizeDomain([
        0,
        Math.max(...histogramBins.map((bin) => bin.count), 0),
      ]);
  const yTicks = getTicks(histogramYDomain, yTickCount);
  const xTicks = getTicks(histogramXDomain, xTickCount);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const activeBin = activeIndex == null ? null : histogramBins[activeIndex];
  const activeX =
    activeBin == null
      ? null
      : getHistogramBinCenterX(layout, histogramXDomain, activeBin);
  const activeY =
    activeBin == null
      ? null
      : scaleY(layout, histogramYDomain, activeBin.count);
  const activeValues =
    activeBin == null
      ? []
      : [
          {
            key: "count",
            label: countLabel,
            color: activeBin.color ?? color,
            value: activeBin.count,
            displayValue: formatCount(activeBin.count),
          },
        ];

  return (
    <figure
      data-slot="chart-histogram-graph"
      className={cn("grid gap-2", className)}
      {...props}
    >
      {hasData ? (
        <>
          <div
            data-slot="chart-scroll-area"
            tabIndex={0}
            className={cn(
              "overflow-x-auto overflow-y-visible",
              shouldScroll && "pb-2 [scrollbar-width:thin]",
            )}
          >
            <div
              data-slot="chart-scroll-content"
              className="relative"
              style={{ minWidth: shouldScroll ? chartWidth : undefined }}
            >
              <svg
                role="img"
                aria-label={ariaLabel}
                viewBox={`0 0 ${chartWidth} ${height}`}
                className="h-auto w-full overflow-visible"
                onPointerLeave={() => setActiveIndex(null)}
              >
                {showGrid ? (
                  <ChartGridLines
                    layout={layout}
                    ticks={yTicks}
                    domain={histogramYDomain}
                  />
                ) : null}
                <ChartHistogramAxes
                  domain={histogramYDomain}
                  formatCount={formatCount}
                  formatValue={formatValue}
                  layout={layout}
                  showXAxis={showXAxis}
                  showYAxis={showYAxis}
                  xDomain={histogramXDomain}
                  xTicks={xTicks}
                  yTicks={yTicks}
                />
                <g data-slot="chart-histogram-graph-series">
                  {histogramBins.map((bin, index) => (
                    <HistogramBar
                      key={`${bin.min}-${bin.max}-${index}`}
                      bin={bin}
                      color={color}
                      domain={histogramXDomain}
                      index={index}
                      isActive={activeIndex == null || activeIndex === index}
                      layout={layout}
                      yDomain={histogramYDomain}
                    />
                  ))}
                </g>
                {interactive ? (
                  <ChartHistogramInteractionLayer
                    activeBin={activeBin}
                    activeIndex={activeIndex}
                    activeValues={activeValues}
                    activeX={activeX}
                    activeY={activeY}
                    ariaLabel={ariaLabel}
                    bins={histogramBins}
                    formatBin={formatBin}
                    layout={layout}
                    onActiveIndexChange={setActiveIndex}
                    xDomain={histogramXDomain}
                  />
                ) : null}
              </svg>
            </div>
          </div>
        </>
      ) : (
        <div
          role="img"
          aria-label={ariaLabel}
          className="flex min-h-40 items-center justify-center border border-dashed text-sm text-muted-foreground"
        >
          {emptyMessage}
        </div>
      )}
      {caption ? (
        <figcaption className="text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ChartSparkline({
  data,
  series,
  ariaLabel = "Sparkline chart",
  caption,
  emptyMessage = "No sparkline data.",
  height = SPARKLINE_VIEWBOX.height,
  width = SPARKLINE_VIEWBOX.width,
  yDomain,
  showArea = true,
  showPoints = false,
  formatValue = defaultFormatValue,
  className,
  ...props
}: ChartSparklineProps) {
  const values = data
    .map((datum, index) => {
      const value = getNumericValue(getChartDatumScalar(datum, series.key));

      if (value == null) {
        return null;
      }

      return { index, value };
    })
    .filter((item): item is { index: number; value: number } => item !== null);
  const hasData = values.length > 0;
  const domain = yDomain
    ? normalizeDomain(yDomain)
    : normalizeDomain(getNumericDomain(values));
  const color = getSeriesColor(series, 0);
  const points = values.map((item) => ({
    index: item.index,
    value: item.value,
    x: getSparklineX(width, data.length, item.index),
    y: scaleSparklineY(height, domain, item.value),
  }));

  return (
    <figure
      data-slot="chart-sparkline"
      className={cn("grid gap-1.5", className)}
      {...props}
    >
      {hasData ? (
        <svg
          role="img"
          aria-label={ariaLabel}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full overflow-visible"
        >
          {showArea ? (
            <path
              data-slot="chart-sparkline-area"
              d={getSparklineAreaPath(points, height)}
              fill={color}
              fillOpacity={0.16}
            />
          ) : null}
          <path
            data-slot="chart-sparkline-line"
            d={getLinePath(points)}
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            className={series.className}
          />
          {showPoints
            ? points.map((point) => (
                <circle
                  key={point.index}
                  data-slot="chart-sparkline-point"
                  cx={point.x}
                  cy={point.y}
                  r={2.5}
                  fill="var(--background)"
                  stroke={color}
                  strokeWidth={1.5}
                >
                  <title>
                    {series.label ?? series.key}: {formatValue(point.value)}
                  </title>
                </circle>
              ))
            : null}
        </svg>
      ) : (
        <div
          role="img"
          aria-label={ariaLabel}
          className="flex min-h-14 items-center justify-center border border-dashed text-xs text-muted-foreground"
        >
          {emptyMessage}
        </div>
      )}
      {caption ? (
        <figcaption className="text-xs text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ChartDonutGraph({
  data,
  valueKey = "value",
  labelKey = "label",
  ariaLabel = "Donut chart",
  caption,
  emptyMessage = "No chart data.",
  size = DONUT_VIEWBOX,
  innerRadius = 58,
  outerRadius = 96,
  showLegend = true,
  showTotal = true,
  centerLabel,
  childrenKey = "children",
  activePath,
  defaultActivePath,
  onActivePathChange,
  onSegmentSelect,
  showBreadcrumbs,
  renderBreadcrumb,
  focusedSegmentPath,
  defaultFocusedSegmentPath,
  onFocusedSegmentPathChange,
  onDrillDown,
  onDrillUp,
  formatLabel = defaultFormatLabel,
  formatValue = defaultFormatValue,
  className,
  ...props
}: ChartDonutGraphProps) {
  const [internalActivePath, setInternalActivePath] = React.useState<number[]>(
    () => [...(defaultActivePath ?? [])],
  );
  const [internalFocusedSegmentPath, setInternalFocusedSegmentPath] =
    React.useState<number[] | null>(() =>
      defaultFocusedSegmentPath ? [...defaultFocusedSegmentPath] : null,
    );
  const segmentRefs = React.useRef(new Map<string, SVGPathElement>());
  const currentActivePath = activePath ? [...activePath] : internalActivePath;
  const safeActivePath = getValidDonutPath(
    data,
    currentActivePath,
    childrenKey,
  );
  const activeNode = getDonutNodeAtPath(data, safeActivePath, childrenKey);
  const activeData = activeNode
    ? getChartDatumChildren(activeNode, childrenKey)
    : data;
  const currentFocusedSegmentPath =
    focusedSegmentPath !== undefined
      ? focusedSegmentPath
        ? [...focusedSegmentPath]
        : null
      : internalFocusedSegmentPath;
  const setDonutPath = React.useCallback(
    (path: number[]) => {
      const nextPath = getValidDonutPath(data, path, childrenKey);

      if (!activePath) {
        setInternalActivePath(nextPath);
      }

      onActivePathChange?.(
        nextPath,
        getDonutNodeAtPath(data, nextPath, childrenKey),
      );
    },
    [activePath, childrenKey, data, onActivePathChange],
  );
  const canGoUp = safeActivePath.length > 0;
  const goUp = React.useCallback(() => {
    const nextPath = safeActivePath.slice(0, -1);
    const nextDatum = getDonutNodeAtPath(data, nextPath, childrenKey);

    setDonutPath(nextPath);
    onDrillUp?.(nextPath, nextDatum);
  }, [childrenKey, data, onDrillUp, safeActivePath, setDonutPath]);
  const handleGoUpKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGCircleElement>) => {
      if (!isActivationKey(event)) {
        return;
      }

      event.preventDefault();
      goUp();
    },
    [goUp],
  );
  const segments = activeData
    .map((datum, index) => {
      const value = getDonutDatumValue(datum, valueKey, childrenKey);

      if (value == null || value <= 0) {
        return null;
      }

      const children = getChartDatumChildren(datum, childrenKey);
      const color = getChartDatumScalar(datum, "color");

      return {
        children,
        datum,
        index,
        label: formatLabel(getChartDatumScalar(datum, labelKey), datum, index),
        value,
        color:
          typeof color === "string" ? color : `var(--chart-${(index % 5) + 1})`,
      };
    })
    .filter(
      (
        item,
      ): item is {
        children: ChartDatum[];
        datum: ChartDatum;
        index: number;
        label: React.ReactNode;
        value: number;
        color: string;
      } => item !== null,
    );
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const hasData = total > 0;
  const hasInteractiveSegments = segments.some(
    (segment) => segment.children.length > 0,
  );
  const isInteractiveDonut =
    hasInteractiveSegments || canGoUp || Boolean(onSegmentSelect);
  const interactiveSegments = segments.filter(
    (segment) => segment.children.length > 0 || Boolean(onSegmentSelect),
  );
  const hasNestedData = hasNestedChartData(data, childrenKey);
  const shouldShowBreadcrumbs = showBreadcrumbs ?? hasNestedData;
  const breadcrumbItems = React.useMemo(
    () =>
      getDonutBreadcrumbItems(data, safeActivePath, {
        ariaLabel,
        childrenKey,
        formatLabel,
        labelKey,
      }),
    [ariaLabel, childrenKey, data, formatLabel, labelKey, safeActivePath],
  );
  const liveRegionText = getDonutLiveRegionText(
    breadcrumbItems[breadcrumbItems.length - 1],
    segments.length,
    ariaLabel,
  );
  const center = size / 2;
  const radiusOuter = Math.min(outerRadius, center - 2);
  const radiusInner = Math.min(innerRadius, radiusOuter - 8);
  let currentAngle = 0;
  const setSegmentRef = React.useCallback(
    (path: number[], element: SVGPathElement | null) => {
      const key = getDonutPathKey(path);

      if (element) {
        segmentRefs.current.set(key, element);
      } else {
        segmentRefs.current.delete(key);
      }
    },
    [],
  );
  const setFocusedDonutSegment = React.useCallback(
    (path: number[] | null, shouldFocusElement = false) => {
      if (focusedSegmentPath === undefined) {
        setInternalFocusedSegmentPath(path ? [...path] : null);
      }

      onFocusedSegmentPathChange?.(
        path ? [...path] : null,
        path ? getDonutNodeAtPath(data, path, childrenKey) : null,
      );

      if (path && shouldFocusElement) {
        queueMicrotask(() =>
          segmentRefs.current.get(getDonutPathKey(path))?.focus(),
        );
      }
    },
    [childrenKey, data, focusedSegmentPath, onFocusedSegmentPathChange],
  );
  const handleSegmentClick = React.useCallback(
    (segment: (typeof segments)[number]) => {
      const nextPath = [...safeActivePath, segment.index];

      setFocusedDonutSegment(nextPath, false);
      onSegmentSelect?.(segment.datum, segment.index, nextPath);

      if (!segment.children.length) {
        return;
      }

      onDrillDown?.(segment.datum, nextPath);
      setDonutPath(nextPath);
    },
    [
      onDrillDown,
      onSegmentSelect,
      safeActivePath,
      setDonutPath,
      setFocusedDonutSegment,
    ],
  );
  const handleChartKeyDown = React.useCallback(
    (event: React.KeyboardEvent<SVGSVGElement>) => {
      const focusedIndex =
        currentFocusedSegmentPath &&
        currentFocusedSegmentPath.length === safeActivePath.length + 1 &&
        safeActivePath.every(
          (pathIndex, index) => pathIndex === currentFocusedSegmentPath[index],
        )
          ? currentFocusedSegmentPath[currentFocusedSegmentPath.length - 1]
          : interactiveSegments[0]?.index;
      const focusedSegment = interactiveSegments.find(
        (segment) => segment.index === focusedIndex,
      );

      if (!focusedSegment && event.key !== "Escape") {
        return;
      }

      if (isActivationKey(event)) {
        event.preventDefault();
        if (focusedSegment) {
          handleSegmentClick(focusedSegment);
        }
        return;
      }

      if (event.key === "Escape" && canGoUp) {
        event.preventDefault();
        goUp();
        return;
      }

      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();

      const currentIndex = interactiveSegments.findIndex(
        (item) => item.index === focusedIndex,
      );
      const nextIndex =
        event.key === "ArrowRight"
          ? (currentIndex + 1) % interactiveSegments.length
          : (currentIndex - 1 + interactiveSegments.length) %
            interactiveSegments.length;
      const nextSegment = interactiveSegments[nextIndex];

      if (nextSegment) {
        setFocusedDonutSegment([...safeActivePath, nextSegment.index]);
      }
    },
    [
      canGoUp,
      currentFocusedSegmentPath,
      goUp,
      handleSegmentClick,
      interactiveSegments,
      safeActivePath,
      setFocusedDonutSegment,
    ],
  );

  return (
    <figure
      data-slot="chart-donut-graph"
      className={cn("grid gap-3", className)}
      {...props}
    >
      {hasData ? (
        <>
          <svg
            role={isInteractiveDonut ? "group" : "img"}
            aria-label={ariaLabel}
            viewBox={`0 0 ${size} ${size}`}
            className="mx-auto h-auto w-full max-w-56 overflow-visible"
            tabIndex={isInteractiveDonut ? 0 : undefined}
            onFocus={
              isInteractiveDonut &&
              !currentFocusedSegmentPath &&
              interactiveSegments[0]
                ? () =>
                    setFocusedDonutSegment([
                      ...safeActivePath,
                      interactiveSegments[0].index,
                    ])
                : undefined
            }
            onKeyDown={isInteractiveDonut ? handleChartKeyDown : undefined}
          >
            <g data-slot="chart-donut-graph-segments">
              {segments.map((segment) => {
                const angle = (segment.value / total) * 360;
                const gap = segments.length > 1 ? Math.min(1.5, angle / 4) : 0;
                const startAngle = currentAngle + gap / 2;
                const endAngle = currentAngle + angle - gap / 2;
                currentAngle += angle;
                const isInteractiveSegment =
                  segment.children.length > 0 || Boolean(onSegmentSelect);

                return (
                  <path
                    key={segment.index}
                    data-slot="chart-donut-graph-segment"
                    role="graphics-symbol"
                    aria-label={`${segment.label}: ${formatValue(segment.value)}${
                      segment.children.length ? ". Enter folder" : ""
                    }`}
                    d={getDonutSegmentPath(
                      center,
                      center,
                      radiusInner,
                      radiusOuter,
                      startAngle,
                      endAngle,
                    )}
                    fill={segment.color}
                    className={cn(
                      "outline-none transition-opacity hover:opacity-80 focus:opacity-80",
                      isInteractiveSegment && "cursor-pointer",
                    )}
                    data-focused={
                      areDonutPathsEqual(currentFocusedSegmentPath, [
                        ...safeActivePath,
                        segment.index,
                      ])
                        ? "true"
                        : undefined
                    }
                    onClick={
                      isInteractiveSegment
                        ? () => handleSegmentClick(segment)
                        : undefined
                    }
                    onMouseEnter={
                      isInteractiveSegment
                        ? () =>
                            setFocusedDonutSegment([
                              ...safeActivePath,
                              segment.index,
                            ])
                        : undefined
                    }
                    ref={(element) =>
                      setSegmentRef([...safeActivePath, segment.index], element)
                    }
                    focusable="false"
                  />
                );
              })}
            </g>
            {canGoUp ? (
              <circle
                data-slot="chart-donut-graph-up"
                role="button"
                aria-label="Go one folder up"
                cx={center}
                cy={center}
                r={Math.max(radiusInner - 4, 1)}
                fill="transparent"
                className="cursor-pointer outline-none transition-colors focus:stroke-ring focus:stroke-2"
                onClick={goUp}
                onKeyDown={handleGoUpKeyDown}
                tabIndex={0}
              >
                <title>Go one folder up</title>
              </circle>
            ) : null}
            {showTotal ? (
              <ChartPretext className="fill-foreground text-center">
                <ChartPretextText
                  x={center}
                  y={center - 5}
                  className="fill-foreground text-lg font-semibold"
                >
                  {formatValue(total)}
                </ChartPretextText>
                {centerLabel ? (
                  <ChartPretextText
                    x={center}
                    y={center + 18}
                    className="fill-muted-foreground text-[10px]"
                  >
                    {typeof centerLabel === "function"
                      ? centerLabel(total)
                      : centerLabel}
                  </ChartPretextText>
                ) : null}
              </ChartPretext>
            ) : null}
          </svg>
          <span className="sr-only" aria-live="polite">
            {liveRegionText}
          </span>
          {shouldShowBreadcrumbs ? (
            <ChartDonutBreadcrumbs
              ariaLabel={`${ariaLabel} breadcrumb`}
              items={breadcrumbItems}
              renderBreadcrumb={renderBreadcrumb}
              onNavigate={(path) => setDonutPath(path)}
            />
          ) : null}
          {showLegend ? (
            <ChartDonutLegend segments={segments} formatValue={formatValue} />
          ) : null}
        </>
      ) : (
        <div
          role="img"
          aria-label={ariaLabel}
          className="flex min-h-40 items-center justify-center border border-dashed text-sm text-muted-foreground"
        >
          {emptyMessage}
        </div>
      )}
      {caption ? (
        <figcaption className="text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ChartGraph({
  graph,
  includeZero = false,
  xScale,
  data,
  series,
  xKey = "label",
  ariaLabel,
  caption,
  summary,
  emptyMessage = "No chart data.",
  noDataReason,
  height = GRAPH_VIEWBOX.height,
  width = GRAPH_VIEWBOX.width,
  yDomain,
  yTickCount = 5,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  showLegend = true,
  interactive = true,
  scrollable,
  scrollPointWidth = GRAPH_SCROLL_POINT_WIDTH,
  valueLabels = false,
  onDatumFocus,
  formatLabel = defaultFormatLabel,
  formatValue = defaultFormatValue,
  pretext,
  className,
  ...props
}: ChartGraphProps & {
  graph: "area" | "bar" | "line";
  includeZero?: boolean;
  xScale: "band" | "point";
}) {
  const shouldScroll = scrollable ?? data.length > 12;
  const chartWidth = shouldScroll
    ? Math.max(
        width,
        GRAPH_PADDING.left +
          GRAPH_PADDING.right +
          data.length * scrollPointWidth,
      )
    : width;
  const layout = getChartLayout({ width: chartWidth, height });
  const domain = getValueDomain(data, series, yDomain, includeZero);
  const yTicks = getTicks(domain, yTickCount);
  const slot = `chart-${graph}-graph`;
  const hasData = data.length > 0 && series.length > 0;
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const activeDatum = activeIndex == null ? null : data[activeIndex];
  const activeX =
    activeIndex == null
      ? null
      : xScale === "band"
        ? getBandCenterX(layout, data.length, activeIndex)
        : getPointX(layout, data.length, activeIndex);
  const activeValues =
    activeDatum && activeIndex != null
      ? series.map((item, index) => {
          const value = getNumericValue(
            getChartDatumScalar(activeDatum, item.key),
          );

          return {
            key: item.key,
            label: item.label ?? item.key,
            color: getSeriesColor(item, index),
            value,
            displayValue: value == null ? "No data" : formatValue(value),
          };
        })
      : [];
  const setFocusedDatum = React.useCallback(
    (index: number | null) => {
      setActiveIndex(index);

      if (index != null) {
        onDatumFocus?.(data[index] as ChartDatum, index);
      }
    },
    [data, onDatumFocus],
  );

  return (
    <figure data-slot={slot} className={cn("grid gap-2", className)} {...props}>
      {hasData ? (
        <>
          <div
            data-slot="chart-scroll-area"
            tabIndex={0}
            className={cn(
              "overflow-x-auto overflow-y-visible",
              shouldScroll && "pb-2 [scrollbar-width:thin]",
            )}
          >
            <div
              data-slot="chart-scroll-content"
              className="relative"
              style={{ minWidth: shouldScroll ? chartWidth : undefined }}
            >
              <svg
                role="img"
                aria-label={ariaLabel}
                viewBox={`0 0 ${chartWidth} ${height}`}
                className="h-auto w-full overflow-visible"
                onPointerLeave={() => setActiveIndex(null)}
              >
                {showGrid ? (
                  <ChartGridLines
                    layout={layout}
                    ticks={yTicks}
                    domain={domain}
                  />
                ) : null}
                <ChartAxes
                  data={data}
                  domain={domain}
                  formatLabel={formatLabel}
                  formatValue={formatValue}
                  layout={layout}
                  showXAxis={showXAxis}
                  showYAxis={showYAxis}
                  ticks={yTicks}
                  xKey={xKey}
                  xScale={xScale}
                />
                <ChartGraphPretext pretext={pretext} />
                <g data-slot={`${slot}-series`}>
                  {graph === "line"
                    ? renderLineGraphSeries(
                        data,
                        series,
                        layout,
                        domain,
                        activeIndex,
                        valueLabels,
                        formatValue,
                      )
                    : graph === "area"
                      ? renderAreaGraphSeries(
                          data,
                          series,
                          layout,
                          domain,
                          activeIndex,
                          valueLabels,
                          formatValue,
                        )
                      : renderBarGraphSeries(
                          data,
                          series,
                          layout,
                          domain,
                          activeIndex,
                          valueLabels,
                          formatValue,
                        )}
                </g>
                {interactive ? (
                  <ChartInteractionLayer
                    activeIndex={activeIndex}
                    activeValues={activeValues}
                    activeX={activeX}
                    ariaLabel={ariaLabel}
                    data={data}
                    domain={domain}
                    formatLabel={formatLabel}
                    layout={layout}
                    onActiveIndexChange={setFocusedDatum}
                    series={series}
                    xKey={xKey}
                    xScale={xScale}
                  />
                ) : null}
              </svg>
            </div>
          </div>
          {showLegend ? <ChartGraphLegend series={series} /> : null}
        </>
      ) : (
        <div
          role="img"
          aria-label={ariaLabel}
          className="flex min-h-40 flex-col items-center justify-center gap-1 border border-dashed text-center text-sm text-muted-foreground"
        >
          <span>{emptyMessage}</span>
          {noDataReason ? (
            <span data-slot="chart-empty-reason" className="text-xs">
              {noDataReason}
            </span>
          ) : null}
        </div>
      )}
      {summary ? (
        <div
          data-slot="chart-summary"
          className="text-sm leading-6 text-foreground"
        >
          {summary}
        </div>
      ) : null}
      {caption ? (
        <figcaption className="text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ChartGraphPretext({ pretext }: { pretext?: ChartPretextItem[] }) {
  return (
    <ChartPretext>
      {pretext?.map((item, index) => (
        <ChartPretextText
          key={item.id ?? index}
          x={item.x}
          y={item.y}
          className={item.className}
          textAnchor={item.textAnchor}
          dominantBaseline={item.dominantBaseline}
        >
          {item.children}
        </ChartPretextText>
      ))}
    </ChartPretext>
  );
}

function renderLineGraphSeries(
  data: ChartDatum[],
  series: ChartSeries[],
  layout: ChartLayout,
  domain: [number, number],
  activeIndex: number | null,
  valueLabels: boolean | "auto",
  formatValue: (value: number) => React.ReactNode,
) {
  return series.map((item, index) => {
    const color = getSeriesColor(item, index);
    const points = data
      .map((datum, datumIndex) => {
        const value = getNumericValue(getChartDatumScalar(datum, item.key));

        if (value == null) {
          return null;
        }

        return {
          index: datumIndex,
          x: getPointX(layout, data.length, datumIndex),
          y: scaleY(layout, domain, value),
        };
      })
      .filter(
        (point): point is { index: number; x: number; y: number } =>
          point !== null,
      );

    return (
      <g key={item.key} data-slot="chart-line-graph-line">
        <path
          d={getLinePath(points)}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          className={item.className}
          opacity={activeIndex == null ? undefined : 0.72}
        />
        {points.map((point, pointIndex) => (
          <circle
            key={pointIndex}
            cx={point.x}
            cy={point.y}
            r={activeIndex === point.index ? 4 : 3}
            fill="var(--background)"
            stroke={color}
            strokeWidth={activeIndex === point.index ? 2 : 1.5}
          />
        ))}
        {shouldRenderValueLabels(valueLabels, data.length)
          ? points.map((point) => {
              const value = getNumericValue(
                getChartDatumScalar(data[point.index] as ChartDatum, item.key),
              );

              return value == null ? null : (
                <ChartPretextText
                  key={`label-${point.index}`}
                  data-slot="chart-value-label"
                  x={point.x}
                  y={point.y - 12}
                  className="fill-foreground"
                >
                  {formatValue(value)}
                </ChartPretextText>
              );
            })
          : null}
      </g>
    );
  });
}

function renderAreaGraphSeries(
  data: ChartDatum[],
  series: ChartSeries[],
  layout: ChartLayout,
  domain: [number, number],
  activeIndex: number | null,
  valueLabels: boolean | "auto",
  formatValue: (value: number) => React.ReactNode,
) {
  const baseline = scaleY(layout, domain, 0);

  return series.map((item, index) => {
    const color = getSeriesColor(item, index);
    const points = data
      .map((datum, datumIndex) => {
        const value = getNumericValue(getChartDatumScalar(datum, item.key));

        if (value == null) {
          return null;
        }

        return {
          index: datumIndex,
          x: getPointX(layout, data.length, datumIndex),
          y: scaleY(layout, domain, value),
        };
      })
      .filter(
        (point): point is { index: number; x: number; y: number } =>
          point !== null,
      );

    return (
      <g key={item.key} data-slot="chart-area-graph-area">
        <path
          d={getAreaPath(points, baseline)}
          fill={color}
          fillOpacity={index === 0 ? 0.24 : 0.14}
          className={item.className}
        />
        <path
          d={getLinePath(points)}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          opacity={activeIndex == null ? undefined : 0.78}
        />
        {points.map((point, pointIndex) => (
          <circle
            key={pointIndex}
            cx={point.x}
            cy={point.y}
            r={activeIndex === point.index ? 4 : 0}
            fill="var(--background)"
            stroke={color}
            strokeWidth={2}
          />
        ))}
        {shouldRenderValueLabels(valueLabels, data.length)
          ? points.map((point) => {
              const value = getNumericValue(
                getChartDatumScalar(data[point.index] as ChartDatum, item.key),
              );

              return value == null ? null : (
                <ChartPretextText
                  key={`label-${point.index}`}
                  data-slot="chart-value-label"
                  x={point.x}
                  y={point.y - 12}
                  className="fill-foreground"
                >
                  {formatValue(value)}
                </ChartPretextText>
              );
            })
          : null}
      </g>
    );
  });
}

function renderBarGraphSeries(
  data: ChartDatum[],
  series: ChartSeries[],
  layout: ChartLayout,
  domain: [number, number],
  activeIndex: number | null,
  valueLabels: boolean | "auto",
  formatValue: (value: number) => React.ReactNode,
) {
  const bandWidth = layout.plotWidth / data.length;
  const groupWidth = bandWidth * 0.68;
  const barWidth = groupWidth / Math.max(series.length, 1);

  return data.map((datum, datumIndex) => {
    const groupX =
      layout.left + bandWidth * datumIndex + (bandWidth - groupWidth) / 2;

    return series.map((item, seriesIndex) => {
      const value = getNumericValue(getChartDatumScalar(datum, item.key)) ?? 0;
      const y = scaleY(layout, domain, value);
      const zeroY = scaleY(layout, domain, 0);

      const x = groupX + barWidth * seriesIndex;
      const barTop = Math.min(y, zeroY);

      return (
        <g key={`${datumIndex}-${item.key}`}>
          <rect
            data-slot="chart-bar-graph-bar"
            x={x}
            y={barTop}
            width={Math.max(barWidth - 3, 1)}
            height={Math.abs(zeroY - y)}
            fill={getSeriesColor(item, seriesIndex)}
            className={item.className}
            opacity={
              activeIndex == null || activeIndex === datumIndex
                ? undefined
                : 0.35
            }
          />
          {shouldRenderValueLabels(valueLabels, data.length) ? (
            <ChartPretextText
              data-slot="chart-value-label"
              x={x + Math.max(barWidth - 3, 1) / 2}
              y={barTop - 10}
              className="fill-foreground"
            >
              {formatValue(value)}
            </ChartPretextText>
          ) : null}
        </g>
      );
    });
  });
}

function HistogramBar({
  bin,
  color,
  domain,
  index,
  isActive,
  layout,
  yDomain,
}: {
  bin: ChartHistogramBin;
  color: string;
  domain: [number, number];
  index: number;
  isActive: boolean;
  layout: ChartLayout;
  yDomain: [number, number];
}) {
  const x0 = scaleX(layout, domain, bin.min);
  const x1 = scaleX(layout, domain, bin.max);
  const gap = Math.min(4, Math.max(1, (x1 - x0) * 0.08));
  const x = x0 + gap / 2;
  const barWidth = Math.max(x1 - x0 - gap, 1);
  const y = scaleY(layout, yDomain, bin.count);
  const zeroY = scaleY(layout, yDomain, 0);

  return (
    <rect
      data-slot="chart-histogram-graph-bar"
      x={x}
      y={Math.min(y, zeroY)}
      width={barWidth}
      height={Math.abs(zeroY - y)}
      fill={bin.color ?? color}
      className={bin.className}
      opacity={isActive ? undefined : 0.35}
    >
      <title>
        {bin.label ?? defaultFormatHistogramBin(bin)}:{" "}
        {defaultFormatValue(bin.count)}
      </title>
    </rect>
  );
}

function ChartHistogramAxes({
  domain,
  formatCount,
  formatValue,
  layout,
  showXAxis,
  showYAxis,
  xDomain,
  xTicks,
  yTicks,
}: {
  domain: [number, number];
  formatCount: (value: number) => React.ReactNode;
  formatValue: (value: number) => React.ReactNode;
  layout: ChartLayout;
  showXAxis: boolean;
  showYAxis: boolean;
  xDomain: [number, number];
  xTicks: number[];
  yTicks: number[];
}) {
  return (
    <ChartPretext data-slot="chart-axes" className="fill-muted-foreground">
      {showYAxis
        ? yTicks.map((tick) => (
            <ChartPretextText
              key={tick}
              x={layout.left - 10}
              y={scaleY(layout, domain, tick)}
              textAnchor="end"
            >
              {formatCount(tick)}
            </ChartPretextText>
          ))
        : null}
      {showXAxis
        ? xTicks.map((tick) => (
            <ChartPretextText
              key={tick}
              x={scaleX(layout, xDomain, tick)}
              y={layout.bottom + 22}
              dominantBaseline="hanging"
            >
              {formatValue(tick)}
            </ChartPretextText>
          ))
        : null}
    </ChartPretext>
  );
}

function ChartHistogramInteractionLayer({
  activeBin,
  activeIndex,
  activeValues,
  activeX,
  activeY,
  ariaLabel,
  bins,
  formatBin,
  layout,
  onActiveIndexChange,
  xDomain,
}: {
  activeBin: ChartHistogramBin | null;
  activeIndex: number | null;
  activeValues: Array<{
    key: string;
    label: React.ReactNode;
    color: string;
    value: number | null;
    displayValue: React.ReactNode;
  }>;
  activeX: number | null;
  activeY: number | null;
  ariaLabel?: string;
  bins: ChartHistogramBin[];
  formatBin: (bin: ChartHistogramBin, index: number) => React.ReactNode;
  layout: ChartLayout;
  onActiveIndexChange: (index: number | null) => void;
  xDomain: [number, number];
}) {
  const activeLabel =
    activeBin && activeIndex != null ? formatBin(activeBin, activeIndex) : null;

  return (
    <g data-slot="chart-interaction-layer">
      {activeIndex != null && activeX != null ? (
        <line
          data-slot="chart-crosshair"
          x1={activeX}
          x2={activeX}
          y1={layout.top}
          y2={layout.bottom}
          className="stroke-border"
          strokeDasharray="4 4"
        />
      ) : null}
      {bins.map((bin, index) => {
        const x0 = scaleX(layout, xDomain, bin.min);
        const x1 = scaleX(layout, xDomain, bin.max);
        const label = formatBin(bin, index);

        return (
          <rect
            key={`${bin.min}-${bin.max}-${index}`}
            data-slot="chart-hit-area"
            role="graphics-symbol"
            aria-label={`${ariaLabel ?? "Histogram"} ${label}`}
            x={x0}
            y={layout.top}
            width={Math.max(x1 - x0, 1)}
            height={layout.plotHeight}
            fill="transparent"
            className="cursor-crosshair outline-none"
            onFocus={() => onActiveIndexChange(index)}
            onBlur={() => onActiveIndexChange(null)}
            onPointerEnter={() => onActiveIndexChange(index)}
            onPointerMove={() => onActiveIndexChange(index)}
          />
        );
      })}
      {activeIndex != null && activeX != null && activeBin ? (
        <ChartGraphTooltip
          label={activeLabel}
          layout={layout}
          values={activeValues}
          x={activeX}
          y={activeY}
        />
      ) : null}
    </g>
  );
}

function ChartInteractionLayer({
  activeIndex,
  activeValues,
  activeX,
  ariaLabel,
  data,
  domain,
  formatLabel,
  layout,
  onActiveIndexChange,
  series,
  xKey,
  xScale,
}: {
  activeIndex: number | null;
  activeValues: Array<{
    key: string;
    label: React.ReactNode;
    color: string;
    value: number | null;
    displayValue: React.ReactNode;
  }>;
  activeX: number | null;
  ariaLabel?: string;
  data: ChartDatum[];
  domain: [number, number];
  formatLabel: (
    value: ChartDatumValue,
    datum: ChartDatum,
    index: number,
  ) => React.ReactNode;
  layout: ChartLayout;
  onActiveIndexChange: (index: number | null) => void;
  series: ChartSeries[];
  xKey: string;
  xScale: "band" | "point";
}) {
  const activeDatum = activeIndex == null ? null : data[activeIndex];
  const activeLabel =
    activeDatum && activeIndex != null
      ? formatLabel(
          getChartDatumScalar(activeDatum, xKey),
          activeDatum,
          activeIndex,
        )
      : null;
  const activeY =
    activeDatum == null
      ? null
      : Math.min(
          ...series.flatMap((item) => {
            const value = getNumericValue(
              getChartDatumScalar(activeDatum, item.key),
            );

            return value == null ? [] : [scaleY(layout, domain, value)];
          }),
        );

  return (
    <g data-slot="chart-interaction-layer">
      {activeIndex != null && activeX != null ? (
        <line
          data-slot="chart-crosshair"
          x1={activeX}
          x2={activeX}
          y1={layout.top}
          y2={layout.bottom}
          className="stroke-border"
          strokeDasharray="4 4"
        />
      ) : null}
      {data.map((datum, index) => {
        const hitArea = getDatumHitArea(layout, data.length, index, xScale);
        const label = formatLabel(
          getChartDatumScalar(datum, xKey),
          datum,
          index,
        );

        return (
          <rect
            key={index}
            data-slot="chart-hit-area"
            role="graphics-symbol"
            aria-label={`${ariaLabel ?? "Chart"} ${label}`}
            x={hitArea.x}
            y={layout.top}
            width={hitArea.width}
            height={layout.plotHeight}
            fill="transparent"
            className="cursor-crosshair outline-none"
            onFocus={() => onActiveIndexChange(index)}
            onBlur={() => onActiveIndexChange(null)}
            onPointerEnter={() => onActiveIndexChange(index)}
            onPointerMove={() => onActiveIndexChange(index)}
          />
        );
      })}
      {activeIndex != null && activeX != null && activeDatum ? (
        <ChartGraphTooltip
          label={activeLabel}
          layout={layout}
          values={activeValues}
          x={activeX}
          y={Number.isFinite(activeY) ? activeY : layout.top}
        />
      ) : null}
    </g>
  );
}

function ChartGraphTooltip({
  label,
  layout,
  values,
  x,
  y,
}: {
  label: React.ReactNode;
  layout: ChartLayout;
  values: Array<{
    key: string;
    label: React.ReactNode;
    color: string;
    value: number | null;
    displayValue: React.ReactNode;
  }>;
  x: number;
  y: number | null;
}) {
  const height = 34 + values.length * GRAPH_TOOLTIP_ROW_HEIGHT;
  const tooltipX = clamp(
    x - GRAPH_TOOLTIP_WIDTH / 2,
    layout.left,
    layout.right - GRAPH_TOOLTIP_WIDTH,
  );
  const preferredY = (y ?? layout.top) - height - 10;
  const tooltipY = clamp(
    preferredY,
    layout.top,
    Math.max(layout.top, layout.bottom - height),
  );

  return (
    <foreignObject
      data-slot="chart-graph-tooltip"
      x={tooltipX}
      y={tooltipY}
      width={GRAPH_TOOLTIP_WIDTH}
      height={height}
      className="pointer-events-none overflow-visible"
    >
      <div className="grid gap-1 rounded-lg border border-border/70 bg-background/95 px-2.5 py-2 text-xs shadow-xl backdrop-blur">
        <div className="font-medium text-foreground">{label}</div>
        <div className="grid gap-1">
          {values.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {item.displayValue}
              </span>
            </div>
          ))}
        </div>
      </div>
    </foreignObject>
  );
}

type ChartLayout = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  plotWidth: number;
  plotHeight: number;
};

function getChartLayout({
  width,
  height,
}: {
  width: number;
  height: number;
}): ChartLayout {
  const left = GRAPH_PADDING.left;
  const right = width - GRAPH_PADDING.right;
  const top = GRAPH_PADDING.top;
  const bottom = height - GRAPH_PADDING.bottom;

  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    plotWidth: right - left,
    plotHeight: bottom - top,
  };
}

function ChartGridLines({
  layout,
  ticks,
  domain,
}: {
  layout: ChartLayout;
  ticks: number[];
  domain: [number, number];
}) {
  return (
    <g data-slot="chart-grid" className="stroke-border/60">
      {ticks.map((tick) => {
        const y = scaleY(layout, domain, tick);

        return (
          <line
            key={tick}
            x1={layout.left}
            x2={layout.right}
            y1={y}
            y2={y}
            strokeDasharray="3 4"
          />
        );
      })}
    </g>
  );
}

function ChartAxes({
  data,
  domain,
  formatLabel,
  formatValue,
  layout,
  showXAxis,
  showYAxis,
  ticks,
  xKey,
  xScale,
}: {
  data: ChartDatum[];
  domain: [number, number];
  formatLabel: (
    value: ChartDatumValue,
    datum: ChartDatum,
    index: number,
  ) => React.ReactNode;
  formatValue: (value: number) => React.ReactNode;
  layout: ChartLayout;
  showXAxis: boolean;
  showYAxis: boolean;
  ticks: number[];
  xKey: string;
  xScale: "band" | "point";
}) {
  const xLabelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <ChartPretext data-slot="chart-axes" className="fill-muted-foreground">
      {showYAxis
        ? ticks.map((tick) => (
            <ChartPretextText
              key={tick}
              x={layout.left - 10}
              y={scaleY(layout, domain, tick)}
              textAnchor="end"
            >
              {formatValue(tick)}
            </ChartPretextText>
          ))
        : null}
      {showXAxis
        ? data.map((datum, index) => {
            if (index % xLabelStep !== 0 && index !== data.length - 1) {
              return null;
            }

            return (
              <ChartPretextText
                key={index}
                x={
                  xScale === "band"
                    ? getBandCenterX(layout, data.length, index)
                    : getPointX(layout, data.length, index)
                }
                y={layout.bottom + 22}
                dominantBaseline="hanging"
              >
                {formatLabel(getChartDatumScalar(datum, xKey), datum, index)}
              </ChartPretextText>
            );
          })
        : null}
    </ChartPretext>
  );
}

function ChartGraphLegend({ series }: { series: ChartSeries[] }) {
  if (series.length <= 1) {
    return null;
  }

  return (
    <div
      data-slot="chart-graph-legend"
      className="flex flex-wrap items-center gap-4 text-xs"
    >
      {series.map((item, index) => (
        <div
          key={item.key}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className="size-2 shrink-0"
            style={{ backgroundColor: getSeriesColor(item, index) }}
          />
          <span>{item.label ?? item.key}</span>
        </div>
      ))}
    </div>
  );
}

function ChartDonutLegend({
  segments,
  formatValue,
}: {
  segments: Array<{
    index: number;
    label: React.ReactNode;
    value: number;
    color: string;
  }>;
  formatValue: (value: number) => React.ReactNode;
}) {
  return (
    <div data-slot="chart-donut-graph-legend" className="grid gap-2 text-sm">
      {segments.map((item) => (
        <div
          key={item.index}
          className="flex items-center justify-between gap-3"
        >
          <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            {formatValue(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartDonutBreadcrumbs({
  ariaLabel,
  items,
  renderBreadcrumb,
  onNavigate,
}: {
  ariaLabel: string;
  items: ChartDonutBreadcrumbItem[];
  renderBreadcrumb?: ChartDonutGraphProps["renderBreadcrumb"];
  onNavigate: (path: number[]) => void;
}) {
  return (
    <nav data-slot="chart-donut-graph-breadcrumbs" aria-label={ariaLabel}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          const label = renderBreadcrumb?.(item, index, items) ?? item.label;

          return (
            <li
              key={getDonutPathKey(item.path)}
              className="flex min-w-0 items-center gap-1"
            >
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {current ? (
                <span
                  data-slot="chart-donut-graph-breadcrumb-current"
                  aria-current="page"
                  className="min-w-0 truncate font-medium text-foreground"
                >
                  {label}
                </span>
              ) : (
                <button
                  type="button"
                  data-slot="chart-donut-graph-breadcrumb"
                  className="min-w-0 truncate rounded-sm px-1 py-0.5 outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                  onClick={() => onNavigate(item.path)}
                >
                  {label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function getChartDatumScalar(datum: ChartDatum, key: string): ChartDatumValue {
  const value = datum[key];

  return Array.isArray(value) ? undefined : value;
}

function getChartDatumChildren(
  datum: ChartDatum,
  childrenKey: string,
): ChartDatum[] {
  const children = datum[childrenKey];

  return Array.isArray(children) ? children : [];
}

function getDonutDatumValue(
  datum: ChartDatum,
  valueKey: string,
  childrenKey: string,
): number | null {
  const value = getNumericValue(getChartDatumScalar(datum, valueKey));

  if (value != null) {
    return value;
  }

  const childTotal = getChartDatumChildren(datum, childrenKey).reduce(
    (sum, child) => {
      const childValue = getDonutDatumValue(child, valueKey, childrenKey);

      return sum + (childValue ?? 0);
    },
    0,
  );

  return childTotal > 0 ? childTotal : null;
}

function getValidDonutPath(
  data: ChartDatum[],
  path: number[],
  childrenKey: string,
): number[] {
  let currentData = data;
  const validPath: number[] = [];

  for (const index of path) {
    const node = currentData[index];

    if (!node) {
      break;
    }

    const children = getChartDatumChildren(node, childrenKey);

    if (!children.length) {
      break;
    }

    validPath.push(index);
    currentData = children;
  }

  return validPath;
}

function getDonutNodeAtPath(
  data: ChartDatum[],
  path: number[],
  childrenKey: string,
): ChartDatum | null {
  let currentData = data;
  let currentNode: ChartDatum | null = null;

  for (const index of path) {
    const node = currentData[index];

    if (!node) {
      return null;
    }

    currentNode = node;
    currentData = getChartDatumChildren(node, childrenKey);
  }

  return currentNode;
}

function getDonutBreadcrumbItems(
  data: ChartDatum[],
  path: number[],
  {
    ariaLabel,
    childrenKey,
    formatLabel,
    labelKey,
  }: {
    ariaLabel: string;
    childrenKey: string;
    formatLabel: NonNullable<ChartDonutGraphProps["formatLabel"]>;
    labelKey: string;
  },
): ChartDonutBreadcrumbItem[] {
  const items: ChartDonutBreadcrumbItem[] = [
    { label: ariaLabel, path: [], datum: null },
  ];
  let currentData = data;
  const currentPath: number[] = [];

  path.forEach((itemIndex) => {
    const datum = currentData[itemIndex];

    if (!datum) {
      return;
    }

    currentPath.push(itemIndex);
    items.push({
      label: formatLabel(
        getChartDatumScalar(datum, labelKey),
        datum,
        itemIndex,
      ),
      path: [...currentPath],
      datum,
    });
    currentData = getChartDatumChildren(datum, childrenKey);
  });

  return items;
}

function hasNestedChartData(data: ChartDatum[], childrenKey: string): boolean {
  return data.some((datum) => {
    const children = getChartDatumChildren(datum, childrenKey);

    return children.length > 0 || hasNestedChartData(children, childrenKey);
  });
}

function getDonutLiveRegionText(
  item: ChartDonutBreadcrumbItem | undefined,
  segmentCount: number,
  fallbackLabel: string,
) {
  const label = getRenderableText(item?.label) || fallbackLabel;

  return `Viewing ${label}, ${segmentCount} ${segmentCount === 1 ? "segment" : "segments"}`;
}

function getRenderableText(value: React.ReactNode): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function getDonutPathKey(path: readonly number[]): string {
  return path.length ? path.join(".") : "root";
}

function areDonutPathsEqual(
  first: readonly number[] | null | undefined,
  second: readonly number[] | null | undefined,
) {
  if (!first || !second || first.length !== second.length) {
    return false;
  }

  return first.every((item, index) => item === second[index]);
}

function isActivationKey(event: React.KeyboardEvent): boolean {
  return event.key === "Enter" || event.key === " ";
}

function getNumericValue(value: ChartDatumValue): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function getValueDomain(
  data: ChartDatum[],
  series: ChartSeries[],
  yDomain: [number, number] | undefined,
  includeZero: boolean,
): [number, number] {
  if (yDomain) {
    return normalizeDomain(yDomain);
  }

  const values = data.flatMap((datum) =>
    series.flatMap((item) => {
      const value = getNumericValue(getChartDatumScalar(datum, item.key));

      return value == null ? [] : [value];
    }),
  );

  if (includeZero) {
    values.push(0);
  }

  if (!values.length) {
    return [0, 1];
  }

  return normalizeDomain([Math.min(...values), Math.max(...values)]);
}

function getHistogramBins({
  data,
  values,
  bins,
  xDomain,
}: {
  data?: ChartHistogramBin[];
  values?: number[];
  bins: number | number[];
  xDomain?: [number, number];
}): ChartHistogramBin[] {
  if (data?.length) {
    return data.filter(
      (bin) =>
        Number.isFinite(bin.min) &&
        Number.isFinite(bin.max) &&
        Number.isFinite(bin.count) &&
        bin.max > bin.min &&
        bin.count >= 0,
    );
  }

  const numericValues = (values ?? []).filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value),
  );

  if (!numericValues.length) {
    return [];
  }

  const valueDomain = xDomain
    ? normalizeDomain(xDomain)
    : normalizeDomain([Math.min(...numericValues), Math.max(...numericValues)]);
  const edges = getHistogramEdges(valueDomain, bins);

  if (edges.length < 2) {
    return [];
  }

  const histogramBins = edges.slice(0, -1).map((min, index) => ({
    min,
    max: edges[index + 1] as number,
    count: 0,
  }));

  for (const value of numericValues) {
    const binIndex = getHistogramBinIndex(edges, value);

    if (binIndex != null && histogramBins[binIndex]) {
      histogramBins[binIndex].count += 1;
    }
  }

  return histogramBins;
}

function getHistogramEdges(
  domain: [number, number],
  bins: number | number[],
): number[] {
  const [min, max] = domain;

  if (Array.isArray(bins)) {
    const thresholds = bins.filter((value) => value > min && value < max);

    return [min, ...thresholds, max]
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b)
      .filter(
        (value, index, edges) => index === 0 || value !== edges[index - 1],
      );
  }

  const count = Math.max(1, Math.floor(bins));
  const step = (max - min) / count;

  return Array.from({ length: count + 1 }, (_, index) => min + step * index);
}

function getHistogramBinIndex(edges: number[], value: number): number | null {
  const first = edges[0];
  const last = edges[edges.length - 1];

  if (value < first || value > last) {
    return null;
  }

  if (value === last) {
    return edges.length - 2;
  }

  const index = edges.findIndex((edge, edgeIndex) => {
    const next = edges[edgeIndex + 1];

    return next != null && value >= edge && value < next;
  });

  return index === -1 ? null : index;
}

function getHistogramXDomain(bins: ChartHistogramBin[]): [number, number] {
  if (!bins.length) {
    return [0, 1];
  }

  return normalizeDomain([
    Math.min(...bins.map((bin) => bin.min)),
    Math.max(...bins.map((bin) => bin.max)),
  ]);
}

function getNumericDomain(values: Array<{ value: number }>): [number, number] {
  if (!values.length) {
    return [0, 1];
  }

  const numericValues = values.map((item) => item.value);

  return [Math.min(...numericValues), Math.max(...numericValues)];
}

function normalizeDomain([min, max]: [number, number]): [number, number] {
  if (min === max) {
    const offset = min === 0 ? 1 : Math.abs(min) * 0.1;

    return [min - offset, max + offset];
  }

  return [min, max];
}

function getTicks([min, max]: [number, number], tickCount: number): number[] {
  const count = Math.max(tickCount, 2);
  const step = (max - min) / (count - 1);

  return Array.from({ length: count }, (_, index) => min + step * index);
}

function scaleY(
  layout: ChartLayout,
  [min, max]: [number, number],
  value: number,
): number {
  return layout.bottom - ((value - min) / (max - min)) * layout.plotHeight;
}

function scaleX(
  layout: ChartLayout,
  [min, max]: [number, number],
  value: number,
): number {
  return layout.left + ((value - min) / (max - min)) * layout.plotWidth;
}

function getHistogramBinCenterX(
  layout: ChartLayout,
  domain: [number, number],
  bin: ChartHistogramBin,
): number {
  return scaleX(layout, domain, bin.min + (bin.max - bin.min) / 2);
}

function getPointX(
  layout: ChartLayout,
  dataLength: number,
  index: number,
): number {
  if (dataLength <= 1) {
    return layout.left + layout.plotWidth / 2;
  }

  return layout.left + (layout.plotWidth / (dataLength - 1)) * index;
}

function getBandCenterX(
  layout: ChartLayout,
  dataLength: number,
  index: number,
): number {
  if (dataLength <= 0) {
    return layout.left + layout.plotWidth / 2;
  }

  return layout.left + (layout.plotWidth / dataLength) * (index + 0.5);
}

function getLinePath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function getAreaPath(
  points: Array<{ x: number; y: number }>,
  baseline: number,
): string {
  if (!points.length) {
    return "";
  }

  const linePath = getLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];

  return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function getSparklineAreaPath(
  points: Array<{ x: number; y: number }>,
  height: number,
): string {
  if (!points.length) {
    return "";
  }

  const baseline = height - SPARKLINE_PADDING;
  const first = points[0];
  const last = points[points.length - 1];

  return `${getLinePath(points)} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function getSparklineX(
  width: number,
  dataLength: number,
  index: number,
): number {
  if (dataLength <= 1) {
    return width / 2;
  }

  const plotWidth = width - SPARKLINE_PADDING * 2;

  return SPARKLINE_PADDING + (plotWidth / (dataLength - 1)) * index;
}

function scaleSparklineY(
  height: number,
  [min, max]: [number, number],
  value: number,
): number {
  const plotHeight = height - SPARKLINE_PADDING * 2;

  return (
    height - SPARKLINE_PADDING - ((value - min) / (max - min)) * plotHeight
  );
}

function getDonutSegmentPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const normalizedEnd =
    endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;
  const startOuter = getPolarPoint(cx, cy, outerRadius, startAngle);
  const endOuter = getPolarPoint(cx, cy, outerRadius, normalizedEnd);
  const startInner = getPolarPoint(cx, cy, innerRadius, normalizedEnd);
  const endInner = getPolarPoint(cx, cy, innerRadius, startAngle);
  const largeArcFlag = normalizedEnd - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function getPolarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function getDatumHitArea(
  layout: ChartLayout,
  dataLength: number,
  index: number,
  xScale: "band" | "point",
): { x: number; width: number } {
  if (xScale === "band") {
    const bandWidth = layout.plotWidth / dataLength;

    return {
      x: layout.left + bandWidth * index,
      width: bandWidth,
    };
  }

  const current = getPointX(layout, dataLength, index);
  const previous =
    index === 0 ? layout.left : getPointX(layout, dataLength, index - 1);
  const next =
    index === dataLength - 1
      ? layout.right
      : getPointX(layout, dataLength, index + 1);
  const x = index === 0 ? layout.left : previous + (current - previous) / 2;
  const width =
    index === dataLength - 1
      ? layout.right - x
      : next - (next - current) / 2 - x;

  return {
    x,
    width: Math.max(width, 1),
  };
}

function getSeriesColor(series: ChartSeries, index: number): string {
  return series.color ?? `var(--chart-${(index % 5) + 1})`;
}

function shouldRenderValueLabels(
  valueLabels: boolean | "auto",
  dataLength: number,
) {
  return valueLabels === true || (valueLabels === "auto" && dataLength <= 8);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function defaultFormatLabel(value: ChartDatumValue): React.ReactNode {
  return value == null ? "" : String(value);
}

function defaultFormatValue(value: number): React.ReactNode {
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function defaultFormatHistogramBin(bin: ChartHistogramBin): React.ReactNode {
  return (
    bin.label ??
    `${defaultFormatValue(bin.min)} - ${defaultFormatValue(bin.max)}`
  );
}

export {
  ChartAreaGraph,
  ChartBarGraph,
  ChartDonutGraph,
  ChartHistogramGraph,
  ChartLineGraph,
  ChartPretext,
  ChartPretextText,
  ChartSparkline,
};
export type {
  ChartDatum,
  ChartDatumValue,
  ChartDonutBreadcrumbItem,
  ChartDonutGraphProps,
  ChartGraphProps,
  ChartHistogramBin,
  ChartHistogramGraphProps,
  ChartPretextItem,
  ChartSeries,
  ChartSparklineProps,
};

export type ChartAreaGraphProps = React.ComponentProps<typeof ChartAreaGraph>;
export type ChartBarGraphProps = React.ComponentProps<typeof ChartBarGraph>;
export type ChartLineGraphProps = React.ComponentProps<typeof ChartLineGraph>;
export type ChartPretextProps = React.ComponentProps<typeof ChartPretext>;
export type ChartPretextTextProps = React.ComponentProps<
  typeof ChartPretextText
>;
