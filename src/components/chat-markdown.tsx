"use client";

import { memo, type ComponentProps } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const remarkPlugins = [remarkGfm];
const rehypePlugins: ComponentProps<typeof Markdown>["rehypePlugins"] = [
  [
    rehypeHighlight,
    {
      detect: true,
      subset: [
        "xml",
        "css",
        "javascript",
        "typescript",
        "python",
        "json",
        "bash",
        "sql",
      ],
    },
  ],
];

// Keep completed messages from being parsed again as other messages stream.
export const ChatMarkdown = memo(function ChatMarkdown({
  content,
}: {
  content: string;
}) {
  return (
    <div className="markdown">
      <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {content}
      </Markdown>
    </div>
  );
});
