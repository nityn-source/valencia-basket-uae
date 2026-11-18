import type { TocItem } from "@/lib/blogToc";

/**
 * "Contents" box for a blog article. Rendered on the server as plain HTML: the
 * Hide / Show control is a native <details>, and every entry is an ordinary
 * anchor link to a heading id, so it needs no script and is in the page for
 * search engines. Styles are in globals.css (.blog-toc).
 */
export function BlogToc({ items }: { items: TocItem[] }) {
  return (
    <details className="blog-toc" open data-testid="blog-toc">
      <summary>
        <span className="blog-toc-title">Contents</span>
        <span className="blog-toc-toggle">
          <span className="blog-toc-hide">hide</span>
          <span className="blog-toc-show">show</span>
        </span>
      </summary>
      <nav aria-label="Contents">
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>
                <span className="blog-toc-num">{item.number}</span>
                <span className="blog-toc-text">{item.text}</span>
              </a>
              {item.children.length > 0 && (
                <ol>
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <a href={`#${child.id}`}>
                        <span className="blog-toc-num">{child.number}</span>
                        <span className="blog-toc-text">{child.text}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
