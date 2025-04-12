import { useState, useEffect, useRef } from 'react';
import { FiCpu, FiDownload, FiPlay, FiLoader, FiCode, FiX } from 'react-icons/fi';
import aiService from '../../services/aiService';
import simpleStorage from '../../utils/simpleStorage';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';

const ComputeTab = () => {
  const hardcodedPrompt = `Create a JSON array for an underwriter's report analyzing a Florida insurance company. Each object in the array must represent a critical macro-category and include four keys:
title: A short, clear heading for the category.
prompt: A concise, data-focused instruction explaining what to analyze.
content: Leave empty (do not populate).
relevant_files: List specific standardized files that directly support this category.
Requirements:
Base categories strictly on data from the provided files. Omit categories without supporting documents.
Use simple, non-technical language for clarity.
Ensure each category is modular (no overlap) and actionable for underwriting.
Avoid speculative claims, assumptions, or unsupported metrics. Only reference data explicitly in the files.
Format the JSON array cleanly, with no markdown or extra symbols.`;

  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(hardcodedPrompt);
  const [blocks, setBlocks] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });
  
  // Add AbortController refs
  const abortControllerRef = useRef(null);

  // Configure DnD sensors with proper constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum drag distance to start dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load standardized files on component mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const storedFiles = await simpleStorage.getItem('standardized_files');
        setFiles(Array.isArray(storedFiles) ? storedFiles : []);
      } catch (e) {
        console.error('Failed to load files:', e);
      }
    };

    loadFiles();

    // Cleanup function to abort any pending requests when unmounting
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generateReport = async () => {
    if (isProcessing) return;
    
    // Abort any existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsProcessing(true);
    setProgress('Preparing files...');
    setError(null);
    setBlocks([]);

    try {
      const promptToSend = debugMode && customPrompt.trim() ? customPrompt : hardcodedPrompt;
      console.log(`Generating report with ${files.length} files`);
      
      const response = await aiService.query(
        promptToSend,
        files, // Pass all standardized files
        '',
        signal, // Pass the signal to allow request cancellation
        null,
        (message) => setProgress(message)
      );

      // Make sure the request wasn't aborted
      if (signal.aborted) return;

      let jsonResponse;
      try {
        // Clean up response in case it contains markdown code blocks
        const cleanedResponse = response.replace(/```json|```/g, '').trim();
        jsonResponse = JSON.parse(cleanedResponse);
      } catch (err) {
        console.error("Error parsing JSON response:", err);
        throw new Error('AI response is not valid JSON.\nResponse:\n' + response);
      }

      // Add IDs and default states to each block
      const blocksWithIds = jsonResponse.map((block, idx) => ({ 
        id: `block-${Date.now()}-${idx}`, 
        ...block, 
        content: block.content || '',
        isGenerating: false,
        isGenerated: false
      }));
      
      setBlocks(blocksWithIds);
      
    } catch (err) {
      if (signal.aborted) {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error during report generation:', err);
      setError(err.message);
    } finally {
      if (!signal.aborted) {
        setIsProcessing(false);
        setProgress('');
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(item => item.id === active.id);
      const newIndex = blocks.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setBlocks(prev => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  const deleteBlock = (index) => {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const editBlock = (index, field, value) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = {
        ...newBlocks[index],
        [field]: value
      };
      return newBlocks;
    });
  };

  const generateBlockContent = async (index) => {
    if (isGeneratingContent) return;
    
    const block = blocks[index];
    if (!block || block.isGenerating) return;
    
    // Abort any existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsGeneratingContent(true);
    setActiveBlockId(block.id);
    
    // Update block status
    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = {
        ...newBlocks[index],
        isGenerating: true
      };
      return newBlocks;
    });
    
    try {
      setProgress('Generating content...');
      
      // Find relevant files
      const relevantFileNames = block.relevant_files || [];
      const relevantFiles = files.filter(file => 
        relevantFileNames.includes(file.name)
      );
      
      // Use relevant files if specified, otherwise use all files
      const filesToUse = relevantFiles.length > 0 ? relevantFiles : files;
      
      const content = await aiService.query(
        block.prompt,
        filesToUse,
        '',
        signal, // Pass the signal
        null,
        (message) => setProgress(message)
      );

      // Make sure the request wasn't aborted
      if (signal.aborted) return;
      
      // Update block with generated content
      setBlocks(prev => {
        const newBlocks = [...prev];
        newBlocks[index] = {
          ...newBlocks[index],
          content,
          isGenerating: false,
          isGenerated: true
        };
        return newBlocks;
      });
      
    } catch (err) {
      if (signal.aborted) {
        console.log('Request was aborted');
        return;
      }
      
      console.error(`Error generating content for block ${index}:`, err);
      setError(`Failed to generate content: ${err.message}`);
      
      // Mark generation as failed
      setBlocks(prev => {
        const newBlocks = [...prev];
        newBlocks[index] = {
          ...newBlocks[index],
          isGenerating: false
        };
        return newBlocks;
      });
    } finally {
      if (!signal.aborted) {
        setIsGeneratingContent(false);
        setProgress('');
        setActiveBlockId(null);
      }
    }
  };

  const inspectBlock = (index) => {
    const block = blocks[index];
    if (block && block.content) {
      setModalContent({
        title: block.title,
        content: block.content
      });
      setShowContentModal(true);
    }
  };

  const exportJson = () => {
    // Remove internal properties before export
    const exportData = blocks.map(({ id, isGenerating, isGenerated, ...rest }) => rest);
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `underwriter_report_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="bg-surface border border-border-primary rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FiCpu className="w-5 h-5 mr-2 text-text-secondary" />
          <h2 className="text-xl font-medium">Underwriter Report Generator</h2>
        </div>
        
        <p className="mb-6 text-text-secondary">
          Generate a structured underwriting report based on your uploaded files. Drag blocks to reorder sections.
        </p>
        
        {debugMode && (
          <div className="mb-6">
            <textarea
              className="w-full h-32 p-2 mb-2 bg-background border border-border-secondary rounded text-text-primary"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generateReport}
            disabled={isProcessing || files.length === 0}
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
          
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center"
          >
            <FiCode className="mr-2" /> 
            {debugMode ? 'Disable Debug' : 'Enable Debug'}
          </button>
          
          {blocks.length > 0 && (
            <button
              onClick={exportJson}
              className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center"
            >
              <FiDownload className="mr-2" /> 
              Export Report
            </button>
          )}
        </div>
        
        {progress && (
          <div className="mt-4">
            <p className="text-text-secondary">{progress}</p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 text-status-error rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {files.length === 0 && (
          <div className="mt-4 p-4 bg-status-warning/10 border border-status-warning/20 text-status-warning rounded">
            Please upload and standardize files in the Files tab before generating a report.
          </div>
        )}
      </div>
      
      {/* Block listing with drag and drop */}
      {blocks.length > 0 && (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map(block => block.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <SortableItem
                  key={block.id}
                  id={block.id}
                  index={index}
                  block={block}
                  onDelete={() => deleteBlock(index)}
                  onEdit={editBlock}
                  onGenerate={() => generateBlockContent(index)}
                  onInspect={() => inspectBlock(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Full Content Modal */}
      {showContentModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/70 p-4">
          <div className="bg-surface border border-border-primary rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-secondary">
              <h3 className="text-xl font-medium text-text-primary">{modalContent.title}</h3>
              <button 
                onClick={() => setShowContentModal(false)}
                className="p-2 rounded-full text-text-secondary hover:text-status-error hover:bg-background transition-all"
              >
                <FiX />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap text-text-primary font-sans">
                {modalContent.content}
              </pre>
            </div>
            <div className="p-4 border-t border-border-secondary flex justify-end">
              <button
                onClick={() => setShowContentModal(false)}
                className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputeTab;