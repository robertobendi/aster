import React, { useState, useEffect, useRef } from 'react';
import { FiCpu, FiDownload, FiPlay, FiLoader, FiCheck, FiBarChart2, FiAlertTriangle } from 'react-icons/fi';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import aiService from '../../services/aiService';
import simpleStorage from '../../utils/simpleStorage';
import SortableItem from '../SortableItem';

// Main ComputeTab Component
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
  const [generationQueue, setGenerationQueue] = useState([]);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [initialGeneration, setInitialGeneration] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);
  
  // Add AbortController ref
  const abortControllerRef = useRef(null);
  const checkFilesIntervalRef = useRef(null);
  
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
        const filesArray = Array.isArray(storedFiles) ? storedFiles : [];
        setFiles(filesArray);
        setFilesLoaded(filesArray.length > 0);
      } catch (e) {
        console.error('Failed to load files:', e);
      }
    };

    loadFiles();

    // Set up interval to check for files every second
    checkFilesIntervalRef.current = setInterval(async () => {
      try {
        const storedFiles = await simpleStorage.getItem('standardized_files');
        const filesArray = Array.isArray(storedFiles) ? storedFiles : [];
        
        if (filesArray.length > 0 && !filesLoaded) {
          setFiles(filesArray);
          setFilesLoaded(true);
        } else if (filesArray.length === 0 && filesLoaded) {
          setFilesLoaded(false);
        } else if (filesArray.length !== files.length) {
          // Update if the number of files has changed
          setFiles(filesArray);
        }
      } catch (e) {
        console.error('Error checking for files:', e);
      }
    }, 1000);

    // Cleanup function to abort any pending requests and clear interval when unmounting
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (checkFilesIntervalRef.current) {
        clearInterval(checkFilesIntervalRef.current);
      }
    };
  }, [filesLoaded, files.length]);

  // Effect to handle auto-generation of content
  useEffect(() => {
    const processNextInQueue = async () => {
      if (generationQueue.length === 0 || isGeneratingContent || !initialGeneration) return;
      
      const nextIndex = generationQueue[0];
      
      setGenerationQueue(queue => queue.slice(1));
      await generateBlockContent(nextIndex);
      
      // Check if this was the last item
      if (generationQueue.length === 0) {
        setInitialGeneration(false);
        setAllComplete(true);
      }
    };
    
    processNextInQueue();
  }, [generationQueue, isGeneratingContent, initialGeneration]);

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
    setAllComplete(false);

    try {
      const response = await aiService.query(
        hardcodedPrompt,
        files,
        '',
        signal,
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
      
      // Set up generation queue
      setGenerationQueue(blocksWithIds.map((_, index) => index));
      setInitialGeneration(true);
      
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error during report generation:', err);
      setError(err.message);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
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
        signal,
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

  const exportJson = () => {
    // Remove internal properties before export
    const exportData = blocks.map(({ id, isGenerating, isGenerated, ...rest }) => rest);
    const jsonContent = JSON.stringify(exportData, null, 2);
    
    // Create a downloadable file
    const blob = new Blob([jsonContent], { type: 'application/json' });
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
          Generate a structured underwriting report based on your uploaded files. Sections will be automatically analyzed.
        </p>
        
        <div className="flex flex-wrap gap-3">
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
            <p className="text-text-secondary flex items-center">
              <FiLoader className="animate-spin mr-2" />
              {progress}
            </p>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 text-status-error rounded flex items-start">
            <FiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {!filesLoaded && (
          <div className="mt-4 p-4 bg-status-warning/10 border border-status-warning/20 text-status-warning rounded flex items-center">
            <FiAlertTriangle className="mr-2 flex-shrink-0" />
            <span>Please upload and standardize files in the Files tab before generating a report. Checking every second for files...</span>
          </div>
        )}
        
        {allComplete && blocks.length > 0 && (
          <div className="mt-4 p-4 bg-status-success/10 border border-status-success/20 text-status-success rounded flex items-center">
            <FiCheck className="mr-2" />
            <span>All sections analyzed successfully. You can now export the report.</span>
          </div>
        )}
      </div>
      
      {/* Progress card for initial auto-generation */}
      {initialGeneration && generationQueue.length > 0 && (
        <div className="bg-surface border border-border-primary rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiBarChart2 className="w-5 h-5 mr-2 text-text-secondary" />
            <h2 className="text-lg font-medium">Automatic Analysis Progress</h2>
          </div>
          
          <div className="w-full bg-background rounded-full h-2 mb-3">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.round(((blocks.length - generationQueue.length) / blocks.length) * 100)}%` }}
            ></div>
          </div>
          
          <p className="text-text-secondary">
            {blocks.length - generationQueue.length} of {blocks.length} sections analyzed
          </p>
        </div>
      )}
      
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
                  onInspect={null}
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