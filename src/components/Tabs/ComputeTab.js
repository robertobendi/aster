import React, { useState, useEffect, useRef } from "react";
import {
  FiCpu,
  FiDownload,
  FiPlay,
  FiLoader,
  FiCheck,
  FiBarChart2,
  FiAlertTriangle,
  FiPlus,
} from "react-icons/fi";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import aiService from "../../services/aiService";
import simpleStorage from "../../utils/simpleStorage";
import SortableItem from "../SortableItem";

const ComputeTab = ({ blocks, setBlocks }) => {
  const hardcodedPrompt = `
  You have been provided with a set of files that contain data about a Florida insurance company. These files are flexible and may change each time.

Your task:

- Read each file carefully.
- Identify critical categories needed for a thorough underwriter’s report, aimed at assessing the risk and characteristics of the submitting insurance company.
- Create a JSON array, where each element is one category.
- Each category object must have exactly four keys:
  "title" (short heading),
  "prompt" (instructions for how to fill "content"),
  "content" (leave this empty),
  "relevant_files" (list the filenames that support the category).

Guidelines:

- Base each category strictly on data explicitly found in the provided files. Do not speculate or assume.
- Only include categories for which you have supporting information in the files.
- Do not overlap categories: each should be distinct, actionable, and helpful for underwriting risk assessment.
- Subdivide your categories similarly to the example below, focusing on the specific changes or items identified, a short analysis, and the impact on overall underwriting or premium:

1. [Topic or Change]
   Analysis: [Concise explanation]
   Impact: [Positive, Negative, Non-impactful, etc.]

- Use simple, yet professional language.
- Within "prompt", instruct the model that will fill "content" to:
   • Be deterministic.
   • Avoid hallucination.
   • Rely solely on the listed files.
   • Verify any references used are explicitly found in the source files.
   • Re-check for consistency if any potential mismatch or unsupported claim appears.
   • Keep in mind the final goal: providing an underwriter with a clear risk assessment.

You may also include a concluding or summary category synthesizing the overall changes and how they affect underwriting or premium.

Please return your output as a clean JSON array with no additional formatting or commentary.

Note: Because the provided files may change, do not include any static or detailed examples that might cause confusion. Instead, rely purely on the information in whichever files are currently provided.
`;

  // We no longer define [blocks, setBlocks] here - they're coming from props:
  // const [blocks, setBlocks] = useState([]); <-- Removed

  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generationQueue, setGenerationQueue] = useState([]);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState(null);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [initialGeneration, setInitialGeneration] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);

  // For expanded/collapsed content in SortableItem
  const [selectedIndex, setSelectedIndex] = useState(null);

  // For AI request cancellation
  const abortControllerRef = useRef(null);
  // For polling new/removed files
  const checkFilesIntervalRef = useRef(null);

  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Minimum drag distance
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1) Load & poll for standardized files
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const storedFiles = await simpleStorage.getItem("standardized_files");
        const filesArray = Array.isArray(storedFiles) ? storedFiles : [];
        setFiles(filesArray);
        setFilesLoaded(filesArray.length > 0);
      } catch (e) {
        console.error("Failed to load files:", e);
      }
    };

    loadFiles();

    // Periodically check for file changes
    checkFilesIntervalRef.current = setInterval(async () => {
      try {
        const storedFiles = await simpleStorage.getItem("standardized_files");
        const filesArray = Array.isArray(storedFiles) ? storedFiles : [];

        // If new files have appeared:
        if (filesArray.length > 0 && !filesLoaded) {
          setFiles(filesArray);
          setFilesLoaded(true);
        }
        // If all files have been removed:
        else if (filesArray.length === 0 && filesLoaded) {
          setFilesLoaded(false);
        }
        // If the array size changed:
        else if (filesArray.length !== files.length) {
          setFiles(filesArray);
        }
      } catch (e) {
        console.error("Error checking for files:", e);
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (checkFilesIntervalRef.current) {
        clearInterval(checkFilesIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesLoaded, files.length]);

  // 2) Automatically generate content for each block in a queue
  useEffect(() => {
    const processNextInQueue = async () => {
      if (
        generationQueue.length === 0 ||
        isGeneratingContent ||
        !initialGeneration
      ) {
        return;
      }
      // Take the next index
      const nextIndex = generationQueue[0];
      setGenerationQueue((queue) => queue.slice(1));

      await generateBlockContent(nextIndex);

      if (generationQueue.length === 0) {
        // Done generating all
        setInitialGeneration(false);
        setAllComplete(true);
      }
    };

    processNextInQueue();
  }, [generationQueue, isGeneratingContent, initialGeneration]);

  // 3) Generate the initial "macro-categories" array from AI
  const generateReport = async () => {
    if (isProcessing) return;

    // Abort existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsProcessing(true);
    setProgress("Preparing files...");
    setError(null);
    setAllComplete(false);

    // Reset the parent's blocks
    setBlocks([]);

    try {
      // Call AI for the initial JSON structure
      const response = await aiService.query(
        hardcodedPrompt,
        files,
        "",
        signal,
        null,
        (message) => setProgress(message)
      );

      if (signal.aborted) return; // If user canceled

      // Parse response as JSON
      let jsonResponse;
      try {
        // Remove any ```json fences
        const cleanedResponse = response.replace(/```json|```/g, "").trim();
        jsonResponse = JSON.parse(cleanedResponse);
      } catch (err) {
        console.error("Error parsing JSON response:", err);
        throw new Error(
          "AI response is not valid JSON.\nResponse:\n" + response
        );
      }

      // Add unique IDs and default states
      const blocksWithIds = jsonResponse.map((block, idx) => ({
        id: `block-${Date.now()}-${idx}`,
        ...block,
        content: block.content || "",
        isGenerating: false,
        isGenerated: false,
      }));

      // Store in parent's state
      setBlocks(blocksWithIds);

      // Prepare queue to auto-generate each block
      setGenerationQueue(blocksWithIds.map((_, index) => index));
      setInitialGeneration(true);
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        console.log("Request was aborted");
        return;
      }
      console.error("Error during report generation:", err);
      setError(err.message);
    } finally {
      // If not canceled
      if (!abortControllerRef.current?.signal.aborted) {
        setIsProcessing(false);
        setProgress("");
      }
    }
  };

  // 4) Draggable reorder
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((item) => item.id === active.id);
      const newIndex = blocks.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setBlocks((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  // 5) Delete a block by index
  const deleteBlock = (index) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  // 6) Edit a block field
  const editBlock = (index, field, value) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], [field]: value };
      return newBlocks;
    });
  };

  // 7) Generate content for one block
  const generateBlockContent = async (index) => {
    if (isGeneratingContent) return;

    const block = blocks[index];
    if (!block || block.isGenerating) return;

    // Abort existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsGeneratingContent(true);
    setActiveBlockId(block.id);

    // Mark as generating
    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], isGenerating: true };
      return newBlocks;
    });

    try {
      // If user specified files, use them; else use all
      const relevantFileNames = block.relevant_files || [];
      const relevantFiles = files.filter((f) =>
        relevantFileNames.includes(f.name)
      );
      const filesToUse = relevantFiles.length > 0 ? relevantFiles : files;

      // AI request
      const content = await aiService.query(
        block.prompt,
        filesToUse,
        "",
        signal,
        null,
        (message) => setProgress(message)
      );

      if (signal.aborted) return;

      // Store result
      setBlocks((prev) => {
        const newBlocks = [...prev];
        newBlocks[index] = {
          ...newBlocks[index],
          content,
          isGenerating: false,
          isGenerated: true,
        };
        return newBlocks;
      });
    } catch (err) {
      if (signal.aborted) {
        console.log("Request was aborted");
        return;
      }
      console.error(`Error generating content for block ${index}:`, err);
      setError(`Failed to generate content: ${err.message}`);

      // Mark as failed
      setBlocks((prev) => {
        const newBlocks = [...prev];
        newBlocks[index] = { ...newBlocks[index], isGenerating: false };
        return newBlocks;
      });
    } finally {
      if (!signal.aborted) {
        setIsGeneratingContent(false);
        setProgress("");
        setActiveBlockId(null);
      }
    }
  };

  // 8) Export final JSON (omitting internal fields)
  const exportJson = () => {
    const exportData = blocks.map(
      ({ id, isGenerating, isGenerated, ...rest }) => rest
    );
    const jsonContent = JSON.stringify(exportData, null, 2);

    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `underwriter_report_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 9) Add a new block that prompts the user for the prompt text
  const addNewBlock = () => {
    const newPrompt = window.prompt("Enter a prompt for your new block:");
    // If user hits cancel or empty, do nothing
    if (!newPrompt) return;

    setBlocks((prev) => [
      ...prev,
      {
        id: `block-${Date.now()}-${prev.length}`,
        // Title is optional, we can leave it blank or say "Custom"
        title: newPrompt,
        prompt: newPrompt,
        content: "",
        relevant_files: [],
        isGenerating: false,
        isGenerated: false,
      },
    ]);
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Generator Controls */}
      <div className="bg-surface border border-border-primary rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FiCpu className="w-5 h-5 mr-2 text-text-secondary" />
          <h2 className="text-xl font-medium">Underwriter Report Generator</h2>
        </div>

        <p className="mb-6 text-text-secondary">
          Generate a structured underwriting report based on your uploaded
          files. Sections will be automatically analyzed.
        </p>

        <div className="flex flex-wrap gap-3">
          {/* Generate Report Button */}
          <button
            onClick={generateReport}
            disabled={isProcessing || !filesLoaded}
            className="px-4 py-2 bg-primary text-background rounded hover:opacity-90 transition-all disabled:opacity-50 flex items-center"
          >
            {isProcessing ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FiPlay className="mr-2" />
                Generate Report
              </>
            )}
          </button>

          {/* Export JSON Button (only if we have blocks) */}
          {blocks.length > 0 && (
            <button
              onClick={exportJson}
              className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center"
            >
              <FiDownload className="mr-2" />
              Export Report JSON
            </button>
          )}

          {/* Add new block: prompt user for the block's prompt */}
          <button
            onClick={addNewBlock}
            className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center"
          >
            <FiPlus className="mr-2" />
            Add New Block
          </button>
        </div>

        {/* Show progress if ongoing */}
        {progress && (
          <div className="mt-4">
            <p className="text-text-secondary flex items-center">
              <FiLoader className="animate-spin mr-2" />
              {progress}
            </p>
          </div>
        )}

        {/* Show errors if any */}
        {error && (
          <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 text-status-error rounded flex items-start">
            <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Warn if no standardized files */}
        {!filesLoaded && (
          <div className="mt-4 p-4 bg-status-warning/10 border border-status-warning/20 text-status-warning rounded flex items-center">
            <FiAlertTriangle className="mr-2 flex-shrink-0" />
            <span>
              Please upload and standardize files in the Files tab before
              generating a report. Checking every second for files...
            </span>
          </div>
        )}

        {/* Show "all complete" message if everything is generated */}
        {allComplete && blocks.length > 0 && (
          <div className="mt-4 p-4 bg-status-success/10 border border-status-success/20 text-status-success rounded flex items-center">
            <FiCheck className="mr-2" />
            <span>
              All sections analyzed successfully. You can now export the report
              or add new blocks.
            </span>
          </div>
        )}
      </div>

      {/* Progress bar for auto-generation */}
      {initialGeneration && generationQueue.length > 0 && (
        <div className="bg-surface border border-border-primary rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiBarChart2 className="w-5 h-5 mr-2 text-text-secondary" />
            <h2 className="text-lg font-medium">Automatic Analysis Progress</h2>
          </div>
          <div className="w-full bg-background rounded-full h-2 mb-3">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(
                  ((blocks.length - generationQueue.length) / blocks.length) *
                    100
                )}%`,
              }}
            />
          </div>
          <p className="text-text-secondary">
            {blocks.length - generationQueue.length} of {blocks.length} sections
            analyzed
          </p>
        </div>
      )}

      {/* Render all blocks with drag & drop */}
      {blocks.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((block) => block.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <SortableItem
                  key={block.id}
                  id={block.id}
                  index={index}
                  block={block}
                  onDelete={deleteBlock}
                  onEdit={editBlock}
                  onGenerate={generateBlockContent}
                  isSelected={selectedIndex === index}
                  onSelect={(i) => setSelectedIndex(i)}
                  // FIX: pass the files prop
                  files={files}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default ComputeTab;
