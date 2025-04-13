import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  FiX, FiEdit, FiMove, FiRefreshCw, 
  FiLoader, FiCheck, FiPlay 
} from 'react-icons/fi';
import RegenerateModal from './RegenerateModal';

const SortableItem = ({
  id,
  index,
  block,
  onDelete,
  onEdit,
  onGenerate,
  onInspect,
  isSelected,         // <-- NEW: passed-in prop from parent indicating if this item is selected
  onSelect            // <-- NEW: parent’s callback to select this item
}) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging
  } = useSortable({ id });
  
  // Instead of separate states for editing title and content, use a single toggle
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [content, setContent] = useState(block.content || '');
  const [promptInput, setPromptInput] = useState(block.prompt || '');
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [alternatives, setAlternatives] = useState([]);

  // When the parent re-renders with new content, we can sync that if needed:
  React.useEffect(() => {
    setContent(block.content || '');
  }, [block.content]);

  // Expand or collapse content based on isSelected
  const showFullContent = isSelected;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const saveEdit = () => {
    // Save both title & content in one go
    onEdit(index, 'title', title);
    onEdit(index, 'content', content);
    setIsEditing(false);
  };

  // Determine status colors for the left border
  const getStatusClasses = () => {
    if (block.isGenerating) {
      return "border-l-4 border-l-primary before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:to-transparent before:animate-pulse before:z-0";
    } else if (block.isGenerated) {
      return "border-l-4 border-l-status-success";
    } else {
      return "border-l-4 border-l-text-secondary";
    }
  };

  // If the user clicks anywhere inside this item (aside from button controls), mark it selected
  const handleItemClick = (e) => {
    // Prevent toggling selection if we clicked a button
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
      return;
    }
    onSelect(index);
  };

  const handleRegenerateContent = async (customPrompt, callback) => {
    setIsRegenerating(true);
    
    try {
      // Generate 3 alternative versions
      const prompts = [
        `${customPrompt} - Version 1: Focus on key findings and actionable recommendations.`,
        `${customPrompt} - Version 2: Provide detailed analysis with supporting evidence and examples.`,
        `${customPrompt} - Version 3: Present a balanced view with pros and cons, risks and opportunities.`
      ];
      
      const results = await Promise.all(
        prompts.map(prompt => simulateContentGeneration(prompt))
      );
      
      setAlternatives(results);
      if (callback) callback(results);
    } catch (error) {
      console.error('Error generating alternatives:', error);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Dummy generation for demonstration
  const simulateContentGeneration = async (prompt) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (prompt.includes('Version 1')) {
      return `Key Findings:\n• Risk concentration in coastal areas...`;
    } else if (prompt.includes('Version 2')) {
      return `The analysis reveals significant geographic concentration risk...`;
    } else {
      return `Risk Assessment:\n✓ Portfolio diversification has improved...`;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative bg-background border border-border-primary rounded-lg p-4 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer ${getStatusClasses()}`}
      onClick={handleItemClick}  // <-- Clicking the item selects it
    >
      <div className="relative z-1">
        
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          {/* Left side */}
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab p-2 rounded hover:bg-border-secondary text-text-secondary"
              title="Drag to reorder"
            >
              <FiMove />
            </div>
            
            {/* Title display or input if editing */}
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
          
          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Generate or Regenerate buttons */}
            {!block.isGenerating && (
              <>
                {!block.isGenerated ? (
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
            
            {/* Single Edit button:
                Only show if content is generated (i.e. block.content) and we're not generating right now */}
            {block.content && !block.isGenerating && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing((prev) => !prev);
                }}
                className="p-1 rounded text-text-secondary hover:text-primary hover:bg-background"
                title="Edit title & content"
              >
                <FiEdit />
              </button>
            )}
            
            {/* Delete button */}
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
        
        {/* If the content is generating */}
        {block.isGenerating && (
          <div className="mt-3 p-4 bg-surface rounded-md border border-border-secondary">
            <div className="flex flex-col items-center justify-center py-4">
              <FiLoader className="animate-spin text-primary mb-2" size={20} />
              <p className="text-text-secondary text-sm">Analyzing data and generating insights...</p>
            </div>
          </div>
        )}
        
        {/* If there's no content generated (and not generating), show placeholder */}
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
        
        {/* If content has been generated and we are not editing */}
        {block.content && !block.isGenerating && !isEditing && (
          <div className={`mt-3 bg-surface rounded-md border border-border-secondary transition-all duration-300 p-4`}>
            {/* If selected -> full content, otherwise limited */}
            <div className={`overflow-y-auto transition-all duration-300 ${showFullContent ? 'max-h-96' : 'max-h-12'}`}>
              <pre className="text-text-primary whitespace-pre-wrap text-sm font-sans">
                {block.content}
              </pre>
            </div>
          </div>
        )}
        
        {/* If we are editing, show a form for title & content together */}
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
                onClick={() => saveEdit()}
                className="px-3 py-1 text-xs bg-primary text-background rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <RegenerateModal
          isOpen={showRegenerateModal}
          onClose={() => setShowRegenerateModal(false)}
          blockTitle={block.title}
          initialPrompt={block.prompt}
          onRegenerate={handleRegenerateContent}
          onSelect={(selectedContent) => {
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
