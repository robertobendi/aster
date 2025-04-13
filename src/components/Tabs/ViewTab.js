// src/components/Tabs/ViewTab.jsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FiFileText, FiDownload } from "react-icons/fi";

const ViewTab = ({ blocks = [] }) => {
  // If no blocks, show a placeholder
  if (!blocks.length) {
    return (
      <div className="bg-surface border border-border-primary rounded-lg p-6 shadow-sm">
        <p className="text-text-secondary text-sm">
          No blocks to display. Please generate a report in the Compute tab.
        </p>
      </div>
    );
  }

  // Combine all blocks into a single Markdown document
  const combinedMarkdown = blocks
    .map((block, i) => {
      const title = block.title || "Untitled";
      const content = block.content || "_(no content)_";
      // Example format: "## 1. Title\n\nContent\n\n---"
      return `## ${i + 1}. ${title}\n\n${content}`;
    })
    .join("\n\n---\n\n");

  // Helper to download the combined Markdown as a file
  const downloadMarkdown = () => {
    const blob = new Blob([combinedMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `underwriter_report_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:.]/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface border border-border-primary rounded-lg p-6 shadow-sm">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiFileText className="w-5 h-5 text-text-secondary" />
          <h2 className="text-xl font-medium text-text-primary">
            Underwriter Report Preview
          </h2>
        </div>

        <button
          onClick={downloadMarkdown}
          className="flex items-center bg-surface border border-border-primary px-3 py-1 rounded hover:bg-background transition-colors"
          title="Download Markdown file"
        >
          <FiDownload className="mr-1 text-text-secondary" />
          <span className="text-sm text-text-secondary">Download</span>
        </button>
      </div>

      {/* Render the combined markdown */}
      <div className="prose max-w-none text-text-primary text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {combinedMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ViewTab;
