/**
 * Lays two lists of dated items out as table rows, so overlapping periods sit
 * side by side (#499). Each boundary year opens a row, and an item starts on its
 * first row and spans the rows it covers.
 *
 * A cell is `{ item, span }`, `{ item: null }` for an empty cell, or `null` for
 * a row an item above already covers, where no cell may be rendered. Rows run
 * newest first, as the page reads.
 *
 * Every item needs a closed year range, and items in one list may not overlap:
 * a table has one cell per row, so an open or nested entry would vanish.
 */
function checked(items) {
  const sorted = [...items].sort((a, b) => Number(a.start) - Number(b.start));
  sorted.forEach((item, i) => {
    if (!/^\d{4}$/.test(item.start) || !/^\d{4}$/.test(item.end)) {
      throw new Error(`timeline: "${item.title}" needs a start and an end year`);
    }
    if (i > 0 && Number(item.start) < Number(sorted[i - 1].end)) {
      throw new Error(`timeline: "${item.title}" overlaps "${sorted[i - 1].title}"`);
    }
  });
  return items;
}

export function spanRows(left, right) {
  checked(left);
  checked(right);
  const years = [...new Set([...left, ...right].flatMap((i) => [i.start, i.end]))]
    .map(Number)
    .sort((a, b) => b - a);
  const rows = years.slice(0, -1).map((upper, i) => ({ upper, lower: years[i + 1] }));

  const place = (items) =>
    rows.map(({ upper, lower }) => {
      const owner = items.find((i) => Number(i.start) <= lower && Number(i.end) >= upper);
      if (!owner) return { item: null };
      if (Number(owner.end) !== upper) return null;
      const span = rows.filter((r) => Number(owner.start) <= r.lower && Number(owner.end) >= r.upper).length;
      return { item: owner, span };
    });

  const l = place(left);
  const r = place(right);
  return rows.map((_, i) => ({ left: l[i], right: r[i] }));
}
