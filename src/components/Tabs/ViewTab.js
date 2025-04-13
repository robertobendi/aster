// src/components/Tabs/ViewTab.jsx
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// Be sure to import all icons you use:
import { FiFileText, FiDownload, FiLoader, FiAlertTriangle } from "react-icons/fi";

import aiService from "../../services/aiService"; // or your actual path to aiService

const ViewTab = ({ blocks = [], files = [] }) => {
  // Local states for verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [attendibilityScore, setAttendibilityScore] = useState(null);

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

  /**
   * Verify the final report’s correctness vs. the actual data in `files`
   * and produce an “attendibility score” (0–100).
   */
  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    setAttendibilityScore(null);

    // Example prompt – adapt as needed for your system
    const verificationPrompt = `
You are an AI verifying the correctness and completeness of the following underwriter's report. 
You have access to these data files (supplied in JSON form) to check for any mismatches or unsupported claims.

Return a single numeric "attendibility score" from 0 to 100, reflecting how well the final report aligns with the data in the files. 
Provide only that numeric score.

Underwriter's Report (Markdown):
${combinedMarkdown}

Instructions:
1. Compare the content of this report with the provided data from the files.
2. If the report is consistent with the data and no claims are unsupported, the score approaches 100.
3. If it has errors or is incomplete, the score is lower.
4. Provide just the integer or numeric score and nothing else.
`;

    try {
      // Use the same standardized files for context
      const result = await aiService.query(
        verificationPrompt,
        files,      // pass them in as context
        "",         // no defaultContext
        null,       // no custom abort signal
        null,       // no model override
        null        // no progress callback
      );

      // Attempt to parse a 0-100 integer
      const match = result.match(/(\d{1,3})/);
      if (match) {
        const numericScore = parseInt(match[1], 10);
        const clampedScore = Math.min(Math.max(numericScore, 0), 100);
        setAttendibilityScore(clampedScore);
      } else {
        throw new Error("No numeric score found in AI response.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerifyError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-surface border border-border-primary rounded-lg p-6 shadow-sm">
      {/* If verification worked, show a small notice at the top */}
      {attendibilityScore !== null && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 text-primary text-sm rounded">
          The report’s attendibility score is: <b>{attendibilityScore}</b> / 100
        </div>
      )}

      {/* If verification error, show an alert */}
      {verifyError && (
        <div className="mb-4 p-3 bg-status-error/10 border border-status-error/20 text-status-error text-sm rounded flex items-start">
          <FiAlertTriangle className="mr-2 mt-0.5" />
          <span>
            Verification Failed: {verifyError}
          </span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiFileText className="w-5 h-5 text-text-secondary" />
          <h2 className="text-xl font-medium text-text-primary">
            Underwriter Report Preview
          </h2>
        </div>

        <div className="flex gap-2">
          {/* “Verify Credibility” button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center bg-surface border border-border-primary px-3 py-1 rounded hover:bg-background transition-colors"
            title="Verify the final report vs. the data files"
          >
            {isVerifying ? (
              <>
                <FiLoader className="mr-1 text-text-secondary animate-spin" />
                <span className="text-sm text-text-secondary">
                  Verifying...
                </span>
              </>
            ) : (
              <span className="text-sm text-text-secondary">
                Verify Credibility
              </span>
            )}
          </button>

          {/* Existing Download Markdown button */}
          <button
            onClick={downloadMarkdown}
            className="flex items-center bg-surface border border-border-primary px-3 py-1 rounded hover:bg-background transition-colors"
            title="Download Markdown file"
          >
            <FiDownload className="mr-1 text-text-secondary" />
            <span className="text-sm text-text-secondary">Download</span>
          </button>
        </div>
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
