// src/components/Tabs/ViewTab.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiFileText } from "react-icons/fi";

const ViewTab = ({ blocks = [] }) => {
  if (!blocks.length) {
    return (
      <div className="bg-surface border border-border-primary rounded-lg p-6">
        <p className="text-text-secondary">
          No blocks to display. Please generate a report in the Compute tab.
        </p>
      </div>
    );
  }

  const combinedMarkdown = blocks
    .map((block, i) => {
      const title = block.title || "Untitled";
      const content = block.content || "_(no content)_";
      return `## ${i + 1}. ${title}\n\n${content}`;
    })
    .join("\n\n---\n\n");

  return (
    <div className="bg-surface border border-border-primary rounded-lg p-6">
      <div className="flex items-center mb-4">
        <FiFileText className="w-5 h-5 mr-2 text-text-secondary" />
        <h2 className="text-xl font-medium">Underwriter Report Preview</h2>
      </div>
      <div className="prose max-w-none text-text-primary text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {combinedMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ViewTab;
