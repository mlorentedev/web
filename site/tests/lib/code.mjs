/**
 * Source text with its comments removed, for guards that ask "does the site read X?".
 *
 * A comment that names `platform.nodes` or `'nav.lab'` is not a read, and without
 * this a dead field or key stays alive for as long as some comment mentions it.
 * The cut is line-based on purpose: a line that starts with `//`, `/*` or `*` (a
 * JSDoc body) is dropped, and so is an HTML comment. A comment trailing code on
 * the same line is kept, which can only make a guard pass that should fail, never
 * the reverse. Parsing JavaScript properly would need a parser, and that would be
 * a reason to reshape the guard, not to make this cleverer.
 *
 * In Markdown only the comment forms are cut (HTML comments, and MDX block comments in braces):
 * there a line starting with `*` is a list item, not a comment.
 */
export function withoutComments(source, file) {
  const noHtml = source.replace(/<!--[\s\S]*?-->/g, '');
  if (/\.(md|mdx)$/.test(file)) return noHtml.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  return noHtml
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
    .join('\n');
}
