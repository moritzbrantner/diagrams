//! Renderer-independent computation for interactive diagrams.
//!
//! This crate owns validation, deterministic grouped layout, orthogonal routes,
//! bounds, and viewport visibility. Renderers consume this geometry rather than
//! inventing their own layout semantics.

use std::collections::{BTreeMap, BTreeSet};
use std::error::Error;
use std::fmt::{Display, Formatter};

use serde::{Deserialize, Serialize};

const UNGROUPED: &str = "__diagrams_ungrouped__";

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum LayoutDirection {
    LeftToRight,
    TopToBottom,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramPoint {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

impl DiagramBounds {
    fn right(self) -> f64 {
        self.x + self.width
    }

    fn bottom(self) -> f64 {
        self.y + self.height
    }

    fn expand(self, amount: f64) -> Self {
        Self {
            x: self.x - amount,
            y: self.y - amount,
            width: self.width + amount * 2.0,
            height: self.height + amount * 2.0,
        }
    }

    fn intersects(self, other: Self) -> bool {
        self.x <= other.right()
            && self.right() >= other.x
            && self.y <= other.bottom()
            && self.bottom() >= other.y
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramLayoutNodeInput {
    pub id: String,
    pub width: f64,
    pub height: f64,
    #[serde(default)]
    pub group_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramLayoutEdgeInput {
    pub id: String,
    pub source: String,
    pub target: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramLayoutGroupInput {
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct DiagramLayoutOptions {
    pub group_direction: LayoutDirection,
    pub node_direction: LayoutDirection,
    pub padding: f64,
    pub group_gap: f64,
    pub group_padding: f64,
    pub group_title_height: f64,
    pub node_gap: f64,
    pub rank_gap: f64,
    pub edge_clearance: f64,
    pub max_nodes_per_rank: usize,
}

impl Default for DiagramLayoutOptions {
    fn default() -> Self {
        Self {
            group_direction: LayoutDirection::LeftToRight,
            node_direction: LayoutDirection::TopToBottom,
            padding: 32.0,
            group_gap: 96.0,
            group_padding: 36.0,
            group_title_height: 28.0,
            node_gap: 40.0,
            rank_gap: 112.0,
            edge_clearance: 16.0,
            max_nodes_per_rank: 8,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramLayoutInput {
    pub nodes: Vec<DiagramLayoutNodeInput>,
    #[serde(default)]
    pub edges: Vec<DiagramLayoutEdgeInput>,
    #[serde(default)]
    pub groups: Vec<DiagramLayoutGroupInput>,
    #[serde(default)]
    pub options: DiagramLayoutOptions,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PositionedDiagramNode {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub group_id: Option<String>,
}

impl PositionedDiagramNode {
    fn bounds(&self) -> DiagramBounds {
        DiagramBounds {
            x: self.x,
            y: self.y,
            width: self.width,
            height: self.height,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PositionedDiagramGroup {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RoutedDiagramEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub points: Vec<DiagramPoint>,
    pub label_point: DiagramPoint,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramLayout {
    pub nodes: Vec<PositionedDiagramNode>,
    pub edges: Vec<RoutedDiagramEdge>,
    pub groups: Vec<PositionedDiagramGroup>,
    pub bounds: DiagramBounds,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramVisibilityQuery {
    pub viewport: DiagramBounds,
    #[serde(default = "default_overscan")]
    pub overscan: f64,
}

fn default_overscan() -> f64 {
    120.0
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagramVisibility {
    pub node_ids: Vec<String>,
    pub edge_ids: Vec<String>,
    pub group_ids: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DiagramLayoutError(String);

impl DiagramLayoutError {
    fn new(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

impl Display for DiagramLayoutError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(&self.0)
    }
}

impl Error for DiagramLayoutError {}

#[derive(Debug)]
struct LocalGroup {
    id: String,
    synthetic: bool,
    nodes: Vec<PositionedDiagramNode>,
    width: f64,
    height: f64,
}

/// Computes deterministic layout and orthogonal routes for a validated graph.
pub fn layout_graph(input: DiagramLayoutInput) -> Result<DiagramLayout, DiagramLayoutError> {
    validate(&input)?;
    if input.nodes.is_empty() {
        return Ok(DiagramLayout {
            nodes: Vec::new(),
            edges: Vec::new(),
            groups: Vec::new(),
            bounds: DiagramBounds {
                x: 0.0,
                y: 0.0,
                width: input.options.padding * 2.0,
                height: input.options.padding * 2.0,
            },
        });
    }

    let node_groups = input
        .nodes
        .iter()
        .map(|node| {
            (
                node.id.clone(),
                node.group_id
                    .clone()
                    .unwrap_or_else(|| UNGROUPED.to_owned()),
            )
        })
        .collect::<BTreeMap<_, _>>();
    let mut group_ids = input
        .groups
        .iter()
        .map(|group| group.id.clone())
        .collect::<BTreeSet<_>>();
    if input.nodes.iter().any(|node| node.group_id.is_none()) {
        group_ids.insert(UNGROUPED.to_owned());
    }
    let group_ranks = ranks(
        &group_ids,
        input.edges.iter().filter_map(|edge| {
            let source = node_groups.get(&edge.source)?;
            let target = node_groups.get(&edge.target)?;
            (source != target).then(|| (source.clone(), target.clone()))
        }),
    );

    let mut local_groups = Vec::new();
    for group_id in &group_ids {
        let nodes = input
            .nodes
            .iter()
            .filter(|node| node_groups.get(&node.id) == Some(group_id))
            .cloned()
            .collect::<Vec<_>>();
        if nodes.is_empty() {
            continue;
        }
        let ids = nodes
            .iter()
            .map(|node| node.id.clone())
            .collect::<BTreeSet<_>>();
        let node_ranks = ranks(
            &ids,
            input.edges.iter().filter(|&edge| ids.contains(&edge.source) && ids.contains(&edge.target)).map(|edge| (edge.source.clone(), edge.target.clone())),
        );
        local_groups.push(layout_local_group(
            group_id,
            nodes,
            &node_ranks,
            &input.options,
            group_id == UNGROUPED,
        ));
    }

    let origins = place_groups(&local_groups, &group_ranks, &input.options);
    let mut nodes = Vec::new();
    let mut groups = Vec::new();
    for group in local_groups {
        let origin = origins[&group.id];
        for mut node in group.nodes {
            node.x += origin.x;
            node.y += origin.y;
            nodes.push(node);
        }
        if !group.synthetic {
            groups.push(PositionedDiagramGroup {
                id: group.id,
                x: origin.x,
                y: origin.y,
                width: group.width,
                height: group.height,
            });
        }
    }
    nodes.sort_by(|left, right| left.id.cmp(&right.id));
    groups.sort_by(|left, right| left.id.cmp(&right.id));

    let by_id = nodes
        .iter()
        .map(|node| (node.id.as_str(), node))
        .collect::<BTreeMap<_, _>>();
    let edges = input
        .edges
        .iter()
        .enumerate()
        .map(|(index, edge)| {
            route(
                edge,
                by_id[edge.source.as_str()],
                by_id[edge.target.as_str()],
                index,
                input.options.edge_clearance,
            )
        })
        .collect::<Vec<_>>();
    let bounds = compute_bounds(&nodes, &groups, &edges, input.options.padding);

    Ok(DiagramLayout {
        nodes,
        edges,
        groups,
        bounds,
    })
}

/// Returns only elements whose geometry can affect the viewport plus overscan.
pub fn query_visibility(
    layout: &DiagramLayout,
    query: DiagramVisibilityQuery,
) -> Result<DiagramVisibility, DiagramLayoutError> {
    validate_bounds(query.viewport, "viewport")?;
    if !query.overscan.is_finite() || query.overscan < 0.0 {
        return Err(DiagramLayoutError::new(
            "overscan must be finite and non-negative",
        ));
    }
    let viewport = query.viewport.expand(query.overscan);
    let node_ids = layout
        .nodes
        .iter()
        .filter(|node| node.bounds().intersects(viewport))
        .map(|node| node.id.clone())
        .collect::<Vec<_>>();
    let visible_nodes = node_ids.iter().cloned().collect::<BTreeSet<_>>();
    let edge_ids = layout
        .edges
        .iter()
        .filter(|edge| {
            visible_nodes.contains(&edge.source)
                || visible_nodes.contains(&edge.target)
                || points_bounds(&edge.points).is_some_and(|bounds| bounds.intersects(viewport))
        })
        .map(|edge| edge.id.clone())
        .collect();
    let group_ids = layout
        .groups
        .iter()
        .filter(|group| {
            DiagramBounds {
                x: group.x,
                y: group.y,
                width: group.width,
                height: group.height,
            }
            .intersects(viewport)
        })
        .map(|group| group.id.clone())
        .collect();

    Ok(DiagramVisibility {
        node_ids,
        edge_ids,
        group_ids,
    })
}

fn validate(input: &DiagramLayoutInput) -> Result<(), DiagramLayoutError> {
    let options = &input.options;
    for (name, value) in [
        ("padding", options.padding),
        ("groupGap", options.group_gap),
        ("groupPadding", options.group_padding),
        ("groupTitleHeight", options.group_title_height),
        ("nodeGap", options.node_gap),
        ("rankGap", options.rank_gap),
        ("edgeClearance", options.edge_clearance),
    ] {
        if !value.is_finite() || value < 0.0 {
            return Err(DiagramLayoutError::new(format!(
                "{name} must be finite and non-negative"
            )));
        }
    }
    if options.max_nodes_per_rank == 0 {
        return Err(DiagramLayoutError::new(
            "maxNodesPerRank must be greater than zero",
        ));
    }

    let mut group_ids = BTreeSet::new();
    for group in &input.groups {
        if group.id.trim().is_empty() || !group_ids.insert(group.id.clone()) {
            return Err(DiagramLayoutError::new(
                "diagram group ids must be unique and non-empty",
            ));
        }
    }
    let mut node_ids = BTreeSet::new();
    for node in &input.nodes {
        if node.id.trim().is_empty() || !node_ids.insert(node.id.clone()) {
            return Err(DiagramLayoutError::new(
                "diagram node ids must be unique and non-empty",
            ));
        }
        if !node.width.is_finite()
            || node.width <= 0.0
            || !node.height.is_finite()
            || node.height <= 0.0
        {
            return Err(DiagramLayoutError::new(format!(
                "diagram node {} dimensions must be finite and positive",
                node.id
            )));
        }
        if node
            .group_id
            .as_ref()
            .is_some_and(|id| !group_ids.contains(id))
        {
            return Err(DiagramLayoutError::new(format!(
                "diagram node {} references an unknown group",
                node.id
            )));
        }
    }
    let mut edge_ids = BTreeSet::new();
    for edge in &input.edges {
        if edge.id.trim().is_empty() || !edge_ids.insert(edge.id.clone()) {
            return Err(DiagramLayoutError::new(
                "diagram edge ids must be unique and non-empty",
            ));
        }
        if !node_ids.contains(&edge.source) || !node_ids.contains(&edge.target) {
            return Err(DiagramLayoutError::new(format!(
                "diagram edge {} references an unknown node",
                edge.id
            )));
        }
    }
    Ok(())
}

fn validate_bounds(bounds: DiagramBounds, name: &str) -> Result<(), DiagramLayoutError> {
    if !bounds.x.is_finite()
        || !bounds.y.is_finite()
        || !bounds.width.is_finite()
        || !bounds.height.is_finite()
        || bounds.width < 0.0
        || bounds.height < 0.0
    {
        return Err(DiagramLayoutError::new(format!("invalid {name} bounds")));
    }
    Ok(())
}

fn ranks(
    ids: &BTreeSet<String>,
    edges: impl IntoIterator<Item = (String, String)>,
) -> BTreeMap<String, usize> {
    let mut outgoing = ids
        .iter()
        .map(|id| (id.clone(), BTreeSet::new()))
        .collect::<BTreeMap<_, BTreeSet<String>>>();
    let mut indegree = ids
        .iter()
        .map(|id| (id.clone(), 0_usize))
        .collect::<BTreeMap<_, _>>();
    for (source, target) in edges {
        if source != target && outgoing.entry(source).or_default().insert(target.clone()) {
            *indegree.entry(target).or_default() += 1;
        }
    }
    let mut ready = indegree
        .iter()
        .filter_map(|(id, degree)| (*degree == 0).then_some(id.clone()))
        .collect::<BTreeSet<_>>();
    let mut result = ids
        .iter()
        .map(|id| (id.clone(), 0))
        .collect::<BTreeMap<_, _>>();
    let mut visited = BTreeSet::new();
    while let Some(id) = ready.pop_first() {
        visited.insert(id.clone());
        let rank = result[&id];
        for target in outgoing.get(&id).into_iter().flatten() {
            result
                .entry(target.clone())
                .and_modify(|value| *value = (*value).max(rank + 1));
            let degree = indegree.get_mut(target).expect("target indegree");
            *degree -= 1;
            if *degree == 0 {
                ready.insert(target.clone());
            }
        }
    }
    let cycle_rank = result.values().copied().max().unwrap_or(0) + 1;
    for id in ids.difference(&visited) {
        result.insert(id.clone(), cycle_rank);
    }
    result
}

fn layout_local_group(
    id: &str,
    nodes: Vec<DiagramLayoutNodeInput>,
    ranks: &BTreeMap<String, usize>,
    options: &DiagramLayoutOptions,
    synthetic: bool,
) -> LocalGroup {
    let mut rows = BTreeMap::<usize, Vec<DiagramLayoutNodeInput>>::new();
    for node in nodes {
        rows.entry(ranks[&node.id]).or_default().push(node);
    }
    for row in rows.values_mut() {
        row.sort_by(|left, right| left.id.cmp(&right.id));
    }

    let title = if synthetic {
        0.0
    } else {
        options.group_title_height
    };
    let mut primary = options.group_padding + title;
    let mut max_cross: f64 = 0.0;
    let mut positioned = Vec::new();
    for row in rows.values() {
        for lane in row.chunks(options.max_nodes_per_rank) {
            let lane_primary = lane
                .iter()
                .map(|node| primary_size(node.width, node.height, options.node_direction))
                .fold(0.0, f64::max);
            let lane_cross = lane
                .iter()
                .map(|node| cross_size(node.width, node.height, options.node_direction))
                .sum::<f64>()
                + options.node_gap * lane.len().saturating_sub(1) as f64;
            max_cross = max_cross.max(lane_cross);
            let mut cross = options.group_padding;
            for node in lane {
                let offset = (lane_primary
                    - primary_size(node.width, node.height, options.node_direction))
                    / 2.0;
                let (x, y) = xy(primary + offset, cross, options.node_direction);
                positioned.push(PositionedDiagramNode {
                    id: node.id.clone(),
                    x,
                    y,
                    width: node.width,
                    height: node.height,
                    group_id: node.group_id.clone(),
                });
                cross +=
                    cross_size(node.width, node.height, options.node_direction) + options.node_gap;
            }
            primary += lane_primary + options.rank_gap;
        }
    }
    primary -= options.rank_gap;
    let content_primary = (primary - options.group_padding - title).max(0.0);
    let (width, height) = xy(
        content_primary + options.group_padding * 2.0 + title,
        max_cross + options.group_padding * 2.0,
        options.node_direction,
    );
    LocalGroup {
        id: id.to_owned(),
        synthetic,
        nodes: positioned,
        width,
        height,
    }
}

fn place_groups(
    groups: &[LocalGroup],
    ranks: &BTreeMap<String, usize>,
    options: &DiagramLayoutOptions,
) -> BTreeMap<String, DiagramPoint> {
    let mut columns = BTreeMap::<usize, Vec<&LocalGroup>>::new();
    for group in groups {
        columns.entry(ranks[&group.id]).or_default().push(group);
    }
    for column in columns.values_mut() {
        column.sort_by(|left, right| left.id.cmp(&right.id));
    }
    let sizes = columns
        .iter()
        .map(|(rank, column)| {
            let primary = column
                .iter()
                .map(|group| primary_size(group.width, group.height, options.group_direction))
                .fold(0.0, f64::max);
            let cross = column
                .iter()
                .map(|group| cross_size(group.width, group.height, options.group_direction))
                .sum::<f64>()
                + options.group_gap * column.len().saturating_sub(1) as f64;
            (*rank, (primary, cross))
        })
        .collect::<BTreeMap<_, _>>();
    let max_cross = sizes.values().map(|(_, cross)| *cross).fold(0.0, f64::max);
    let mut primary = options.padding;
    let mut result = BTreeMap::new();
    for (rank, column) in columns {
        let (column_primary, column_cross) = sizes[&rank];
        let mut cross = options.padding + (max_cross - column_cross) / 2.0;
        for group in column {
            let offset = (column_primary
                - primary_size(group.width, group.height, options.group_direction))
                / 2.0;
            let (x, y) = xy(primary + offset, cross, options.group_direction);
            result.insert(group.id.clone(), DiagramPoint { x, y });
            cross +=
                cross_size(group.width, group.height, options.group_direction) + options.group_gap;
        }
        primary += column_primary + options.group_gap;
    }
    result
}

fn primary_size(width: f64, height: f64, direction: LayoutDirection) -> f64 {
    match direction {
        LayoutDirection::LeftToRight => width,
        LayoutDirection::TopToBottom => height,
    }
}

fn cross_size(width: f64, height: f64, direction: LayoutDirection) -> f64 {
    match direction {
        LayoutDirection::LeftToRight => height,
        LayoutDirection::TopToBottom => width,
    }
}

fn xy(primary: f64, cross: f64, direction: LayoutDirection) -> (f64, f64) {
    match direction {
        LayoutDirection::LeftToRight => (primary, cross),
        LayoutDirection::TopToBottom => (cross, primary),
    }
}

fn route(
    edge: &DiagramLayoutEdgeInput,
    source: &PositionedDiagramNode,
    target: &PositionedDiagramNode,
    index: usize,
    clearance: f64,
) -> RoutedDiagramEdge {
    let source_center = center(source);
    let target_center = center(target);
    let points = if source.id == target.id {
        let offset = clearance + 24.0 + (index % 4) as f64 * 8.0;
        vec![
            DiagramPoint {
                x: source.x + source.width,
                y: source_center.y,
            },
            DiagramPoint {
                x: source.x + source.width + offset,
                y: source_center.y,
            },
            DiagramPoint {
                x: source.x + source.width + offset,
                y: source.y - offset,
            },
            DiagramPoint {
                x: source_center.x,
                y: source.y - offset,
            },
            DiagramPoint {
                x: source_center.x,
                y: source.y,
            },
        ]
    } else if (target_center.x - source_center.x).abs() >= (target_center.y - source_center.y).abs()
    {
        let forward = target_center.x >= source_center.x;
        let start = DiagramPoint {
            x: if forward {
                source.x + source.width
            } else {
                source.x
            },
            y: source_center.y,
        };
        let end = DiagramPoint {
            x: if forward {
                target.x
            } else {
                target.x + target.width
            },
            y: target_center.y,
        };
        let middle = (start.x + end.x) / 2.0;
        vec![
            start,
            DiagramPoint {
                x: middle,
                y: start.y,
            },
            DiagramPoint {
                x: middle,
                y: end.y,
            },
            end,
        ]
    } else {
        let forward = target_center.y >= source_center.y;
        let start = DiagramPoint {
            x: source_center.x,
            y: if forward {
                source.y + source.height
            } else {
                source.y
            },
        };
        let end = DiagramPoint {
            x: target_center.x,
            y: if forward {
                target.y
            } else {
                target.y + target.height
            },
        };
        let middle = (start.y + end.y) / 2.0;
        vec![
            start,
            DiagramPoint {
                x: start.x,
                y: middle,
            },
            DiagramPoint {
                x: end.x,
                y: middle,
            },
            end,
        ]
    };
    let label_point = longest_segment_midpoint(&points);
    RoutedDiagramEdge {
        id: edge.id.clone(),
        source: edge.source.clone(),
        target: edge.target.clone(),
        points,
        label_point,
    }
}

fn center(node: &PositionedDiagramNode) -> DiagramPoint {
    DiagramPoint {
        x: node.x + node.width / 2.0,
        y: node.y + node.height / 2.0,
    }
}

fn longest_segment_midpoint(points: &[DiagramPoint]) -> DiagramPoint {
    points
        .windows(2)
        .max_by(|left, right| distance(left[0], left[1]).total_cmp(&distance(right[0], right[1])))
        .map(|segment| DiagramPoint {
            x: (segment[0].x + segment[1].x) / 2.0,
            y: (segment[0].y + segment[1].y) / 2.0,
        })
        .unwrap_or(DiagramPoint { x: 0.0, y: 0.0 })
}

fn distance(left: DiagramPoint, right: DiagramPoint) -> f64 {
    (left.x - right.x).abs() + (left.y - right.y).abs()
}

fn compute_bounds(
    nodes: &[PositionedDiagramNode],
    groups: &[PositionedDiagramGroup],
    edges: &[RoutedDiagramEdge],
    padding: f64,
) -> DiagramBounds {
    let mut points = Vec::new();
    for node in nodes {
        points.push(DiagramPoint {
            x: node.x,
            y: node.y,
        });
        points.push(DiagramPoint {
            x: node.x + node.width,
            y: node.y + node.height,
        });
    }
    for group in groups {
        points.push(DiagramPoint {
            x: group.x,
            y: group.y,
        });
        points.push(DiagramPoint {
            x: group.x + group.width,
            y: group.y + group.height,
        });
    }
    for edge in edges {
        points.extend(edge.points.iter().copied());
    }
    points_bounds(&points).unwrap().expand(padding)
}

fn points_bounds(points: &[DiagramPoint]) -> Option<DiagramBounds> {
    let first = points.first()?;
    let (mut min_x, mut min_y, mut max_x, mut max_y) = (first.x, first.y, first.x, first.y);
    for point in &points[1..] {
        min_x = min_x.min(point.x);
        min_y = min_y.min(point.y);
        max_x = max_x.max(point.x);
        max_y = max_y.max(point.y);
    }
    Some(DiagramBounds {
        x: min_x,
        y: min_y,
        width: max_x - min_x,
        height: max_y - min_y,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> DiagramLayoutInput {
        DiagramLayoutInput {
            nodes: [
                ("gateway", "platform"),
                ("orders", "platform"),
                ("db", "platform"),
                ("payments", "external"),
            ]
            .into_iter()
            .map(|(id, group)| DiagramLayoutNodeInput {
                id: id.to_owned(),
                width: 188.0,
                height: 104.0,
                group_id: Some(group.to_owned()),
            })
            .collect(),
            edges: [
                ("gateway-orders", "gateway", "orders"),
                ("orders-db", "orders", "db"),
                ("orders-payments", "orders", "payments"),
            ]
            .into_iter()
            .map(|(id, source, target)| DiagramLayoutEdgeInput {
                id: id.to_owned(),
                source: source.to_owned(),
                target: target.to_owned(),
            })
            .collect(),
            groups: ["platform", "external"]
                .into_iter()
                .map(|id| DiagramLayoutGroupInput { id: id.to_owned() })
                .collect(),
            options: DiagramLayoutOptions::default(),
        }
    }

    #[test]
    fn grouped_layout_is_deterministic_and_centers_related_groups() {
        let first = layout_graph(fixture()).unwrap();
        let second = layout_graph(fixture()).unwrap();
        assert_eq!(first, second);
        let orders = first.nodes.iter().find(|node| node.id == "orders").unwrap();
        let payments = first
            .nodes
            .iter()
            .find(|node| node.id == "payments")
            .unwrap();
        assert!((orders.y - payments.y).abs() < 1.0);
    }

    #[test]
    fn cycles_remain_bounded() {
        let mut input = fixture();
        input.edges.push(DiagramLayoutEdgeInput {
            id: "cycle".to_owned(),
            source: "payments".to_owned(),
            target: "gateway".to_owned(),
        });
        let layout = layout_graph(input).unwrap();
        assert!(layout.bounds.width.is_finite() && layout.bounds.height.is_finite());
    }

    #[test]
    fn visibility_culls_far_nodes() {
        let layout = layout_graph(fixture()).unwrap();
        let gateway = layout
            .nodes
            .iter()
            .find(|node| node.id == "gateway")
            .unwrap();
        let visible = query_visibility(
            &layout,
            DiagramVisibilityQuery {
                viewport: gateway.bounds(),
                overscan: 0.0,
            },
        )
        .unwrap();
        assert!(visible.node_ids.contains(&"gateway".to_owned()));
        assert!(visible.node_ids.len() < layout.nodes.len());
    }
}
