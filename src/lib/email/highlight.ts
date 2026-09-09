/**
 * Wrap search matches in the message body with <mark> elements.
 *
 * Operates on a parsed DOM rather than the HTML string so a query like "img"
 * or "href" cannot match inside tag syntax and corrupt the markup.
 */

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "MARK"]);

export function highlightHtml(html: string, query: string): { html: string; count: number } {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { html, count: 0 };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const needle = trimmed.toLowerCase();
  let count = 0;

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.toLowerCase().includes(needle)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  // Collect first: replacing nodes while the walker is live invalidates it.
  const targets: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    targets.push(current as Text);
    current = walker.nextNode();
  }

  for (const node of targets) {
    const text = node.nodeValue ?? "";
    const fragment = doc.createDocumentFragment();
    let cursor = 0;

    for (;;) {
      const at = text.toLowerCase().indexOf(needle, cursor);
      if (at === -1) break;
      if (at > cursor) fragment.append(text.slice(cursor, at));
      const mark = doc.createElement("mark");
      mark.className = "msg-hit";
      mark.dataset.hit = String(count++);
      mark.textContent = text.slice(at, at + needle.length);
      fragment.append(mark);
      cursor = at + needle.length;
    }

    if (cursor < text.length) fragment.append(text.slice(cursor));
    node.replaceWith(fragment);
  }

  return { html: doc.body.innerHTML, count };
}
