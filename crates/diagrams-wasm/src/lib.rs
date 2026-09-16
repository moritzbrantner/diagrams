//! Thin WebAssembly transport for `diagrams-core`.
//!
//! Layout, routing, validation, and culling semantics belong in `diagrams-core`.
//! This crate only translates JavaScript values to and from that contract.

use diagrams_core::{
    DiagramLayout, DiagramLayoutInput, DiagramVisibilityQuery, layout_graph, query_visibility,
};
use serde::Serialize;
use wasm_bindgen::prelude::*;

/// Computes a deterministic renderer-independent diagram layout.
#[wasm_bindgen(js_name = layoutDiagramGraph)]
pub fn layout_diagram_graph_for_js(input: JsValue) -> Result<JsValue, JsValue> {
    let input = serde_wasm_bindgen::from_value::<DiagramLayoutInput>(input).map_err(to_js_error)?;
    let layout = layout_graph(input).map_err(to_js_error)?;
    encode_json_compatible(&layout)
}

/// Returns the layout elements that can affect a viewport plus overscan.
#[wasm_bindgen(js_name = queryDiagramVisibility)]
pub fn query_diagram_visibility_for_js(
    layout: JsValue,
    query: JsValue,
) -> Result<JsValue, JsValue> {
    let layout = serde_wasm_bindgen::from_value::<DiagramLayout>(layout).map_err(to_js_error)?;
    let query =
        serde_wasm_bindgen::from_value::<DiagramVisibilityQuery>(query).map_err(to_js_error)?;
    let visible = query_visibility(&layout, query).map_err(to_js_error)?;
    encode_json_compatible(&visible)
}

fn encode_json_compatible<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    value
        .serialize(&serde_wasm_bindgen::Serializer::json_compatible())
        .map_err(to_js_error)
}

fn to_js_error(error: impl ToString) -> JsValue {
    JsValue::from_str(&error.to_string())
}
