import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMarkdown } from "../src/components/chat-markdown";

function render(content: string) {
  return renderToStaticMarkup(createElement(ChatMarkdown, { content }));
}

test("HTML source is highlighted and displayed without executing it", () => {
  const html = render('```html\n<button onclick="alert(1)">Hello</button>\n```');
  assert.match(html, /hljs-name/);
  assert.match(html, /hljs-attr/);
  assert.match(html, /&lt;/);
  assert.doesNotMatch(html, /<button/);
});

test("JavaScript tokens are highlighted before the streaming fence closes", () => {
  const html = render('```javascript\nconst greeting = "Hello";');
  assert.match(html, /hljs-keyword/);
  assert.match(html, /hljs-string/);
  assert.match(html, /greeting/);
});

test("unsupported languages fall back to readable escaped code", () => {
  const html = render('```unknown-language\n<widget>example</widget>\n```');
  assert.match(html, /language-unknown-language/);
  assert.match(html, /&lt;widget&gt;example&lt;\/widget&gt;/);
  assert.doesNotMatch(html, /<widget>/);
});

test("unlabelled code can be highlighted automatically", () => {
  const html = render('```\nconst greeting = "Hello";\nconsole.log(greeting);\n```');
  assert.match(html, /hljs-/);
});

test("essays and inline code retain normal Markdown formatting", () => {
  const html = render("# An essay\n\nAn introduction with `inline code`.\n\nA developed paragraph.\n\n## Conclusion\n\nThe closing thought.");
  assert.match(html, /<h1>An essay<\/h1>/);
  assert.match(html, /<code>inline code<\/code>/);
  assert.match(html, /<p>A developed paragraph\.<\/p>/);
  assert.match(html, /<h2>Conclusion<\/h2>/);
  assert.doesNotMatch(html, /hljs/);
});
