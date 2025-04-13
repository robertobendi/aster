// src/components/Tabs/ViewTab.jsx
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FiFileText,
  FiDownload,
  FiLoader,
  FiAlertTriangle,
  FiBarChart2,
} from "react-icons/fi";

import { Bar, Line, Pie } from "react-chartjs-2"; 
import { Chart as ChartJS } from "chart.js/auto";

import aiService from "../../services/aiService";

const ViewTab = ({ blocks = [], files = [] }) => {
  // States for verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [attendibilityScore, setAttendibilityScore] = useState(null);

  // States for AI-generated charts
  const [chartDataMap, setChartDataMap] = useState({});
  const [chartLoadingMap, setChartLoadingMap] = useState({});

  // States for AI-generated summaries
  const [summaryMap, setSummaryMap] = useState({});
  const [summaryLoadingMap, setSummaryLoadingMap] = useState({});

  // If no blocks, show placeholder
  if (!blocks.length) {
    return (
      <div className="bg-surface border border-border-primary rounded-lg p-6 shadow-sm">
        <p className="text-text-secondary text-sm">
          No blocks to display. Please generate a report in the Compute tab.
        </p>
      </div>
    );
  }

  // Combine all blocks into a single Markdown doc for download
  const combinedMarkdown = blocks
    .map((block, i) => {
      const title = block.title || "Untitled";
      const content = block.content || "_(no content)_";
      return `## ${i + 1}. ${title}\n\n${content}`;
    })
    .join("\n\n---\n\n");

  // Helper to download the combined Markdown
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

  // Credibility verification
  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyError(null);
    setAttendibilityScore(null);

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
      const result = await aiService.query(verificationPrompt, files);
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

  /**
   * handleAiGenerateChart
   * 1) Ask the AI to parse relevant data from `files` for the block’s sector
   * 2) Decide on chart type, labels, dataset(s)
   * 3) Return JSON -> parse -> store -> display
   */
  const handleAiGenerateChart = async (block, blockIdx) => {
    setChartLoadingMap((prev) => ({ ...prev, [blockIdx]: true }));

    const sectorTitle = block.title || `Sector#${blockIdx + 1}`;

    const prompt = `
You are an AI that will generate an appropriate chart specification for the following sector: "${sectorTitle}". 
You have the sector's summary content (from the underwriter's report) and raw data in these attached files. 
1. Parse any relevant numeric data from the files that matches or supports the sector. 
2. Decide the best chart type for visualizing this info. 
   Acceptable chart types: "bar", "line", "pie", or "doughnut". 
3. Construct a JSON object specifying "chartType", "labels", and "datasets". 
   Each dataset has "label" and "data" array. Example:
   {
      "chartType": "bar",
      "labels": ["Label1","Label2"],
      "datasets": [
        {"label": "MySeries", "data": [10,20]}
      ]
   }
4. Return only valid JSON. No extra text.

Sector Block Content:
"""
${block.content}
"""
`;

    try {
      const aiResponse = await aiService.query(prompt, files);
      console.log("AI chart response:", aiResponse);

      // Attempt to parse JSON
      const firstBrace = aiResponse.indexOf("{");
      const lastBrace = aiResponse.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object found in AI response");
      }
      const jsonString = aiResponse.substring(firstBrace, lastBrace + 1);
      const chartSpec = JSON.parse(jsonString);

      setChartDataMap((prev) => ({
        ...prev,
        [blockIdx]: chartSpec,
      }));
    } catch (err) {
      console.error("AI chart generation error:", err);
      setChartDataMap((prev) => ({
        ...prev,
        [blockIdx]: { error: err.message },
      }));
    } finally {
      setChartLoadingMap((prev) => ({ ...prev, [blockIdx]: false }));
    }
  };

  /**
   * handleAiSummarize
   * 1) Ask the AI to summarize the block content in ~100 words
   * 2) Store the resulting text in summaryMap
   */
  const handleAiSummarize = async (block, blockIdx) => {
    setSummaryLoadingMap((prev) => ({ ...prev, [blockIdx]: true }));

    // For demonstration, we target about 100 words. 
    // Adjust this prompt as you prefer (e.g., 50 words, 200 words, etc.).
    const prompt = `
You are an AI. Summarize the following text in approximately 100 words, ensuring you capture the key details. 
Return only the summarized text, nothing else.

Text:
"""
${block.content}
"""
    `;

    try {
      const aiResponse = await aiService.query(prompt, files);
      // We'll store it as-is. You could further sanitize or parse if needed.
      setSummaryMap((prev) => ({
        ...prev,
        [blockIdx]: aiResponse.trim(),
      }));
    } catch (err) {
      console.error("AI summarize error:", err);
      setSummaryMap((prev) => ({
        ...prev,
        [blockIdx]: `Error: ${err.message}`,
      }));
    } finally {
      setSummaryLoadingMap((prev) => ({ ...prev, [blockIdx]: false }));
    }
  };

  // Renders the chart using the data from AI
  const renderChart = (chartData) => {
    if (!chartData) return null;

    if (chartData.error) {
      return (
        <div className="mt-4 p-3 bg-status-error/10 border border-status-error/20 text-status-error text-sm rounded">
          Chart Error: {chartData.error}
        </div>
      );
    }

    const { chartType, labels, datasets } = chartData;

    if (!chartType || !labels || !datasets) {
      return (
        <div className="mt-4 p-3 bg-status-error/10 border border-status-error/20 text-status-error text-sm rounded">
          Invalid chart specification returned by AI.
        </div>
      );
    }

    const data = { labels, datasets };

    switch (chartType.toLowerCase()) {
      case "bar":
        return <Bar data={data} />;
      case "line":
        return <Line data={data} />;
      case "pie":
        return <Pie data={data} />;
      case "doughnut":
        return <Pie data={data} options={{ cutout: "50%" }} />;
      default:
        return (
          <div className="mt-4 p-3 bg-status-error/10 border border-status-error/20 text-status-error text-sm rounded">
            Unknown chartType: {chartType}
          </div>
        );
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
          <span>Verification Failed: {verifyError}</span>
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
                <span className="text-sm text-text-secondary">Verifying...</span>
              </>
            ) : (
              <span className="text-sm text-text-secondary">
                Verify Credibility
              </span>
            )}
          </button>

          {/* Download Markdown button */}
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

      {/* Render each block individually */}
      {blocks.map((block, idx) => {
        const title = block.title || "Untitled";
        const content = block.content || "_(no content)_";

        return (
          <div key={idx} className="mb-8">
            <div className="prose max-w-none text-text-primary text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {`## ${title}\n\n${content}`}
              </ReactMarkdown>
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-4 mt-2">
              {/* AI: Generate Chart button */}
              <button
                className="inline-flex items-center bg-surface border border-border-primary px-3 py-1 rounded hover:bg-background transition-colors text-sm text-text-secondary"
                onClick={() => handleAiGenerateChart(block, idx)}
                disabled={chartLoadingMap[idx]}
                title={`Use AI to parse data & generate a relevant chart for "${title}"`}
              >
                {chartLoadingMap[idx] ? (
                  <>
                    <FiLoader className="mr-1 text-text-secondary animate-spin" />
                    Generating Chart...
                  </>
                ) : (
                  <>
                    <FiBarChart2 className="mr-1" />
                    AI: Generate Chart
                  </>
                )}
              </button>

              {/* AI: Summarize button */}
              <button
                className="inline-flex items-center bg-surface border border-border-primary px-3 py-1 rounded hover:bg-background transition-colors text-sm text-text-secondary"
                onClick={() => handleAiSummarize(block, idx)}
                disabled={summaryLoadingMap[idx]}
                title={`AI: Summarize block "${title}"`}
              >
                {summaryLoadingMap[idx] ? (
                  <>
                    <FiLoader className="mr-1 text-text-secondary animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <FiBarChart2 className="mr-1" />
                    AI: Summarize
                  </>
                )}
              </button>
            </div>

            {/* Render chart if we have data */}
            {renderChart(chartDataMap[idx])}

            {/* Render summary if we have it */}
            {summaryMap[idx] && (
              <div className="mt-4 p-3 border border-border-secondary rounded text-sm bg-background text-text-primary">
                <b>AI Summary:</b>
                <p className="mt-1 whitespace-pre-line">{summaryMap[idx]}</p>
              </div>
            )}

            <hr className="my-6 border-border-secondary" />
          </div>
        );
      })}
    </div>
  );
};

export default ViewTab;
