import { useState, useEffect } from 'react';
import { FiCpu, FiDownload, FiPlay, FiLoader, FiCode } from 'react-icons/fi';
import aiService from '../../services/aiService';
import simpleStorage from '../../utils/simpleStorage';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem'; // Updated path if you put it inside the same folder

const ComputeTab = () => {
  const hardcodedPrompt = `Write a list of the most important macro-categories that would be fundamental for an underwriter to draft a report about a Florida insurance company based on the data provided. The output must be a JSON array where each object is a paragraph with "title" and "content". Use simple and intuitive language, modular paragraphs.`;

  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(hardcodedPrompt);
  const [blocks, setBlocks] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
  }, []);

  const generateReport = async () => {
    setIsProcessing(true);
    setProgress('Preparing files...');
    setError(null);

    try {
      const promptToSend = debugMode && customPrompt.trim() ? customPrompt : hardcodedPrompt;
      const response = await aiService.query(
        promptToSend,
        files,
        '',
        null,
        null,
        (message) => setProgress(message)
      );

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(response);
      } catch (err) {
        throw new Error('AI response is not valid JSON.\nResponse:\n' + response);
      }

      setBlocks(jsonResponse.map((block, idx) => ({ id: `block-${idx}`, ...block })));
    } catch (err) {
      console.error('Error during report generation:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active?.id && over?.id && active.id !== over.id) {
      const oldIndex = blocks.findIndex(item => item.id === active.id);
      const newIndex = blocks.findIndex(item => item.id === over.id);
      setBlocks((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const deleteBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const editBlock = (index, field, value) => {
    const newBlocks = [...blocks];
    newBlocks[index][field] = value;
    setBlocks(newBlocks);
  };

  const exportJson = () => {
    const data = blocks.map(({ id, ...rest }) => rest); // Remove the internal id
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `underwriter_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FiCpu className="w-6 h-6 text-text-secondary" />
        <h1 className="text-2xl font-bold">Underwriter Report Generator</h1>
      </div>

      <div className="bg-surface p-6 rounded-lg border border-border-primary">
        <p className="mb-4 text-text-secondary">
          Automatically generates a JSON report based on all uploaded files.
        </p>

        {debugMode && (
          <textarea
            className="w-full p-2 border border-border-secondary rounded mb-4 bg-background text-text-primary"
            rows="6"
            placeholder="Edit prompt for debug..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={isProcessing}
          />
        )}

        <div className="flex flex-wrap gap-4">
          <button
            className="flex items-center px-4 py-2 bg-primary text-background rounded hover:bg-opacity-90 disabled:opacity-50"
            onClick={generateReport}
            disabled={isProcessing || files.length === 0}
          >
            {isProcessing ? <FiLoader className="animate-spin mr-2" /> : <FiPlay className="mr-2" />}
            {isProcessing ? 'Generating...' : 'Generate Report'}
          </button>

          <button
            className="flex items-center px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background"
            onClick={() => setDebugMode(!debugMode)}
            disabled={isProcessing}
          >
            <FiCode className="mr-2" />
            {debugMode ? 'Disable Debug' : 'Enable Debug'}
          </button>

          {blocks.length > 0 && (
            <button
              className="flex items-center px-4 py-2 bg-primary text-background rounded hover:bg-opacity-90"
              onClick={exportJson}
            >
              <FiDownload className="mr-2" />
              Export JSON
            </button>
          )}
        </div>

        {progress && (
          <div className="mt-4 text-sm text-text-secondary">{progress}</div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-status-error/10 border border-status-error/20 text-status-error rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Visualize Blocks */}
      {blocks.length > 0 && (
        <div className="mt-8">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <SortableItem
                    key={block.id}
                    id={block.id}
                    index={index}
                    block={block}
                    onDelete={() => deleteBlock(index)}
                    onEdit={editBlock}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
};

export default ComputeTab;
