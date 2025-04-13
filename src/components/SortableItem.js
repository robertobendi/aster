import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FiX, FiEdit, FiMove, FiRefreshCw,
  FiLoader, FiCheck, FiPlay
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RegenerateModal from './RegenerateModal';
import aiService from '../services/aiService';

const SortableItem = ({
  id,
  index,
  block,
  onDelete,
  onEdit,
  onGenerate,
  isSelected,
  onSelect,
  files
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [content, setContent] = useState(block.content || '');
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // We store the 3 alternative strings if the user regenerates content
  const [alternatives, setAlternatives] = useState([]);

  // Keep local content in sync with block.content
  useEffect(() => {
    setContent(block.content || '');
  }, [block.content]);

  // If this item is selected, we show the "full content" instead of truncated
  const showFullContent = isSelected;

  // Apply drag transform & styling
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  // Save changes from editing the block’s title/content
  const saveEdit = () => {
    onEdit(index, 'title', title);
    onEdit(index, 'content', content);
    setIsEditing(false);
  };

  // Return a CSS class based on block’s generation status
  const getStatusClasses = () => {
    if (block.isGenerating) {
      return "border-l-4 border-l-primary before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:animate-pulse before:z-0";
    } else if (block.isGenerated) {
      return "border-l-4 border-l-status-success";
    } else {
      return "border-l-4 border-l-text-secondary";
    }
  };

  // Only toggle "selected" if the user didn't click on a button/input
  const handleItemClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
      return;
    }
    onSelect(index);
  };

  /**
   * Called from the RegenerateModal. We generate 3 versions of the updated prompt,
   * each instructing the AI to only rely on file IDs if it references any files.
   */
  const handleRegenerateContent = async (customPrompt, callback) => {
    setIsRegenerating(true);

    try {
      // Gather relevant files by ID; if none are listed, fallback to all
      const relevantFileIds = block.relevant_files || [];
      const relevantFiles = files.filter(f => relevantFileIds.includes(f.id));
      const filesToUse = relevantFiles.length > 0 ? relevantFiles : files;

      // We'll produce 3 different "versions"
      const prompts = [
        `${customPrompt}\n\nIMPORTANT: Only use known file IDs if referencing files; do not add ellipses.\n\nVersion 1: Focus on key findings and actionable recommendations.`,
        `${customPrompt}\n\nIMPORTANT: Only use known file IDs if referencing files; do not add ellipses.\n\nVersion 2: Provide detailed analysis with examples. Add markdown graphs if relevant.`,
        `${customPrompt}\n\nIMPORTANT: Only use known file IDs if referencing files; do not add ellipses.\n\nVersion 3: Present a balanced view with pros and cons, risks and opportunities.`
      ];

      const results = [];
      for (const prompt of prompts) {
        const response = await aiService.query(prompt, filesToUse);
        results.push(response);
      }

      // Store these 3 alternatives in local state
      setAlternatives(results);

      // Also let the modal know we got them
      if (callback) callback(results);

    } catch (error) {
      console.error('Error generating alternatives:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-background border border-border-primary rounded-lg p-4 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer ${getStatusClasses()}`}
      onClick={handleItemClick}
    >
      <div className="relative z-1">
        
        {/* Top bar: Title, drag handle, and status tags */}
        <div className="flex items-center justify-between mb-3">
          {/* Left side: Drag handle + Title (or input if editing) */}
          <div className="flex items-center gap-2">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab p-2 rounded hover:bg-border-secondary text-text-secondary"
              title="Drag to reorder"
            >
              <FiMove />
            </div>

            {/* Title field */}
            {isEditing ? (
              <input
                type="text"
                className="bg-background border border-border-secondary text-text-primary rounded p-2 text-sm w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{block.title}</h3>
                {block.isGenerated && (
                  <span className="px-2 py-0.5 bg-status-success/10 text-status-success text-xs rounded-full flex items-center">
                    <FiCheck className="mr-1" />
                    Complete
                  </span>
                )}
                {block.isGenerating && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center">
                    <FiLoader className="animate-spin mr-1" />
                    Analyzing
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Right side: Generate / Regenerate / Edit / Delete buttons */}
          <div className="flex items-center gap-2">
            {!block.isGenerating && (
              <>
                {!block.isGenerated ? (
                  /* If not generated yet, show the "Generate" button */
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerate(index);
                    }}
                    className="p-1 rounded hover:bg-background text-text-secondary hover:text-primary"
                    title="Generate content"
                  >
                    <FiPlay />
                  </button>
                ) : (
                  /* Otherwise show "Regenerate" */
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRegenerateModal(true);
                    }}
                    className="p-1 rounded hover:bg-background text-text-secondary hover:text-primary"
                    title="Regenerate content"
                  >
                    <FiRefreshCw />
                  </button>
                )}
              </>
            )}

            {block.content && !block.isGenerating && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(prev => !prev);
                }}
                className="p-1 rounded text-text-secondary hover:text-primary hover:bg-background"
                title="Edit title & content"
              >
                <FiEdit />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
              className="p-1 rounded text-text-secondary hover:text-status-error hover:bg-background"
              title="Delete block"
            >
              <FiX />
            </button>
          </div>
        </div>
        
        {/* If the block is currently generating content */}
        {block.isGenerating && (
          <div className="mt-3 p-4 bg-surface rounded-md border border-border-secondary">
            <div className="flex flex-col items-center justify-center py-4">
              <FiLoader className="animate-spin text-primary mb-2" size={20} />
              <p className="text-text-secondary text-sm">Analyzing data and generating insights...</p>
            </div>
          </div>
        )}

        {/* If there's no content and we're not generating, show a "Generate" placeholder */}
        {!block.content && !block.isGenerating && (
          <div className="mt-3 p-3 bg-surface rounded-md border border-border-secondary text-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerate(index);
              }}
              className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
            >
              Generate Analysis
            </button>
          </div>
        )}

        {/* If the content is generated and we're not editing, show the markdown content */}
        {block.content && !block.isGenerating && !isEditing && (
          <div className="mt-3 bg-surface rounded-md border border-border-secondary transition-all duration-300 p-4">
            {/* Expand/collapse content based on whether the user has clicked this item */}
            <div className={`overflow-y-auto transition-all duration-300 ${showFullContent ? 'max-h-96' : 'max-h-12'}`}>
              <div className="prose max-w-none text-text-primary text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
        
        {/* If the user is editing the block (title/content) */}
        {isEditing && (
          <div className="mt-3 bg-surface rounded-md border border-border-secondary p-4">
            <label className="block text-sm text-text-secondary mb-1">
              Content
            </label>
            <textarea
              className="w-full bg-background border border-border-secondary text-text-primary rounded p-2 text-sm min-h-32"
              value={content}
              rows={8}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={saveEdit}
                className="px-3 py-1 text-xs bg-primary text-background rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Regenerate Modal - Only shows if user clicked "Regenerate" */}
      {showRegenerateModal && (
        <RegenerateModal
          isOpen={showRegenerateModal}
          onClose={() => setShowRegenerateModal(false)}
          blockTitle={block.title}
          initialPrompt={block.prompt}
          onRegenerate={handleRegenerateContent}
          onSelect={(selectedContent) => {
            // user picks one alternative version
            onEdit(index, 'content', selectedContent);
            setContent(selectedContent);
          }}
          isGenerating={isRegenerating}
        />
      )}
    </div>
  );
};

export default SortableItem;
