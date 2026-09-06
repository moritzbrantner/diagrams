use std::time::Instant;

use diagrams_core::{
    DiagramBounds, DiagramLayoutEdgeInput, DiagramLayoutGroupInput, DiagramLayoutInput,
    DiagramLayoutNodeInput, DiagramLayoutOptions, DiagramVisibilityQuery, layout_graph,
    query_visibility,
};

const NODE_COUNT: usize = 1_200;
const EDGE_COUNT: usize = 2_400;
const GROUP_COUNT: usize = 12;

fn main() {
    let input = create_input();
    let started_at = Instant::now();
    let layout = layout_graph(input).expect("benchmark layout should succeed");
    let layout_elapsed = started_at.elapsed();

    assert_eq!(layout.nodes.len(), NODE_COUNT);
    assert_eq!(layout.edges.len(), EDGE_COUNT);
    assert_eq!(layout.groups.len(), GROUP_COUNT);
    assert!(layout.bounds.width.is_finite() && layout.bounds.height.is_finite());

    let visibility_started_at = Instant::now();
    let first = &layout.nodes[0];
    let viewport = DiagramBounds {
        x: first.x - 80.0,
        y: first.y - 80.0,
        width: 1_280.0,
        height: 720.0,
    };
    for offset in 0..100 {
        let visible = query_visibility(
            &layout,
            DiagramVisibilityQuery {
                viewport: DiagramBounds {
                    x: viewport.x + offset as f64 * 24.0,
                    ..viewport
                },
                overscan: 120.0,
            },
        )
        .expect("visibility query should succeed");
        assert!(visible.node_ids.len() <= NODE_COUNT);
        assert!(visible.edge_ids.len() <= EDGE_COUNT);
        assert!(visible.group_ids.len() <= GROUP_COUNT);
    }
    let visibility_elapsed = visibility_started_at.elapsed();

    println!(
        "diagrams.rust.layout.{NODE_COUNT}nodes.{EDGE_COUNT}edges: {:.1}ms",
        layout_elapsed.as_secs_f64() * 1_000.0
    );
    println!(
        "diagrams.rust.visibility.100queries: {:.1}ms",
        visibility_elapsed.as_secs_f64() * 1_000.0
    );
}

fn create_input() -> DiagramLayoutInput {
    let groups = (0..GROUP_COUNT)
        .map(|index| DiagramLayoutGroupInput {
            id: format!("group-{index}"),
        })
        .collect::<Vec<_>>();
    let nodes = (0..NODE_COUNT)
        .map(|index| DiagramLayoutNodeInput {
            id: format!("node-{index}"),
            width: 176.0 + (index % 3) as f64 * 8.0,
            height: 88.0 + (index % 2) as f64 * 8.0,
            group_id: Some(format!("group-{}", index % GROUP_COUNT)),
        })
        .collect::<Vec<_>>();
    let edges = (0..EDGE_COUNT)
        .map(|index| {
            let source = index % NODE_COUNT;
            let step = if index % 2 == 0 { 1 } else { 13 };
            DiagramLayoutEdgeInput {
                id: format!("edge-{index}"),
                source: format!("node-{source}"),
                target: format!("node-{}", (source + step) % NODE_COUNT),
            }
        })
        .collect::<Vec<_>>();

    DiagramLayoutInput {
        nodes,
        edges,
        groups,
        options: DiagramLayoutOptions::default(),
    }
}
