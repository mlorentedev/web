/**
 * JSON-LD nodes that say what a page is, beyond the site graph every page
 * carries in BaseLayout (#124). Each page passes its own through the layout's
 * `schema` prop, built here from the data the page renders, so the graph
 * cannot claim a title or a date the page does not show.
 */
import { site } from './site';
import type { Lang } from '../i18n/ui';
import type { LocalizedProject } from './portfolio';

const author = { '@id': `${site.url}/#person` };

export const inLanguage = (lang: Lang) => (lang === 'es' ? 'es-ES' : 'en-US');

/** An absolute URL on the site for a path. */
const absolute = (path: string) => new URL(path, site.url).href;

export function blogPosting(post: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  tags: string[];
  lang: Lang;
}) {
  const url = absolute(post.path);
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    url,
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    author,
    publisher: author,
    inLanguage: inLanguage(post.lang),
    ...(post.tags.length > 0 && { keywords: post.tags.join(', ') }),
  };
}

/** A breadcrumb trail; the last item is the page itself. */
export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

/**
 * A project as source code. `codeRepository` and `author` are what tell Hive
 * the MCP server apart from Apache Hive to anything reading the graph.
 */
export function softwareSourceCode(project: LocalizedProject, lang: Lang) {
  return {
    '@type': 'SoftwareSourceCode',
    name: project.title,
    description: project.description,
    ...(project.github && { codeRepository: project.github }),
    ...(project.url && { url: absolute(project.url) }),
    author,
    inLanguage: inLanguage(lang),
    keywords: project.tags.join(', '),
  };
}
