/**
 * A table in a note scrolls sideways when it is wider than the column, and a
 * keyboard user can only scroll what they can focus (#517).
 *
 * The prose styles make every table `display: block; overflow-x: auto` so a
 * wide one scrolls instead of pushing the page sideways. Shiki already gives
 * each `pre` a `tabindex="0"` for the same reason; this gives tables the same
 * stop, and the shared `:focus-visible` rule draws its ring.
 */

function visit(node) {
  if (node.tagName === 'table') node.properties = { ...node.properties, tabIndex: 0 };
  node.children?.forEach(visit);
}

export default function rehypeScrollableTables() {
  return visit;
}
