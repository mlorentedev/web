/**
 * A page lives at its directory URL, so a link to it ends in a slash (#347).
 *
 * `translatePath` applies this to links written in components. The rehype plugin
 * applies it to links written in MDX, where nothing else passes through.
 */

/** `href` with a slash after its path, unless the path already has one or names a file. */
export function withTrailingSlash(href) {
  const [, path, rest] = href.match(/^([^?#]*)(.*)$/);
  if (path.endsWith('/') || path.split('/').pop().includes('.')) return href;
  return `${path}/${rest}`;
}

const isLocalPath = (href) => typeof href === 'string' && href.startsWith('/') && !href.startsWith('//');

function visit(node) {
  if (node.tagName === 'a' && isLocalPath(node.properties?.href)) {
    node.properties.href = withTrailingSlash(node.properties.href);
  }
  node.children?.forEach(visit);
}

export default function rehypeTrailingSlash() {
  return visit;
}
