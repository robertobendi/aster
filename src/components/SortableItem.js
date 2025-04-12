import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiX, FiEdit2, FiEye, FiMove, FiRefreshCw, FiLoader, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

const SortableItem = ({ id, index, block, onDelete, onEdit, onGenerate, onInspect }) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging
  } = useSortable({ id });
  
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [prompt, setPrompt] = useState(block.prompt);
  const [showFullContent, setShowFullContent] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const saveEdit = (field) => {
    onEdit(index, field, field === 'title' ? title : prompt);
    if (field === 'title') setEditingTitle(false);
    if (field === 'prompt') setEditingPrompt(false);
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

  const toggleFullContent = () => {
    setShowFullContent(!showFullContent);
    // Also call the parent's inspect handler if it exists
    if (onInspect) onInspect(index);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative bg-background border border-border-primary rounded-lg p-4 shadow-sm hover:shadow-md transition-all overflow-hidden ${getStatusClasses()}`}
    >
      <div className="relative z-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab p-2 rounded hover:bg-border-secondary text-text-secondary"
              title="Drag to reorder"
            >
              <FiMove />
            </div>
            
            {editingTitle ? (
              <input
                type="text"
                className="bg-background border border-border-secondary text-text-primary rounded p-2 text-sm w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => saveEdit('title')}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit('title')}
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{block.title}</h3>
                {block.isGenerated && (
                  <span className="px-2 py-0.5 bg-status-success/10 text-status-success text-xs rounded-full">
                    Generated
                  </span>
                )}
                {block.isGenerating && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center">
                    <FiLoader className="animate-spin mr-1" />
                    Generating
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onGenerate(index)}
              disabled={block.isGenerating}
              className={`p-1 rounded ${block.isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background text-text-secondary hover:text-primary'}`}
              title="Generate content"
            >
              <FiRefreshCw className={block.isGenerating ? 'animate-spin' : ''} />
            </button>
            
            {block.content && (
              <button 
                onClick={toggleFullContent}
                className="p-1 rounded text-text-secondary hover:text-primary hover:bg-background"
                title={showFullContent ? "Collapse content" : "Expand content"}
              >
                {showFullContent ? <FiMinimize2 /> : <FiMaximize2 />}
              </button>
            )}
            
            <button 
              onClick={() => setEditingTitle(true)}
              className="p-1 rounded text-text-secondary hover:text-primary hover:bg-background"
              title="Edit title"
            >
              <FiEdit2 />
            </button>
            
            <button 
              onClick={() => onDelete(index)}
              className="p-1 rounded text-text-secondary hover:text-status-error hover:bg-background"
              title="Delete block"
            >
              <FiX />
            </button>
          </div>
        </div>
        
        <div>
          {editingPrompt ? (
            <textarea
              className="w-full bg-background border border-border-secondary text-text-primary rounded p-2 text-sm"
              value={prompt}
              rows="3"
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={() => saveEdit('prompt')}
              onKeyDown={(e) => e.ctrlKey && e.key === 'Enter' && saveEdit('prompt')}
              autoFocus
            />
          ) : (
            <p 
              className="text-text-secondary text-sm whitespace-pre-wrap mb-2 cursor-pointer hover:text-text-primary"
              onClick={() => setEditingPrompt(true)}
              title="Click to edit prompt"
            >
              {block.prompt}
            </p>
          )}
        </div>
        
        {block.relevant_files && block.relevant_files.length > 0 && (
          <div className="mt-2 text-xs text-text-secondary">
            <span className="font-medium">Files:</span> {block.relevant_files.join(', ')}
          </div>
        )}
        
        {/* Content display - either preview or full */}
        {block.content && !block.isGenerating && (
          <div className={`mt-3 bg-surface rounded-md border border-border-secondary transition-all duration-300 ${showFullContent ? 'p-4' : 'p-2'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary">
                {showFullContent ? "Full Content" : "Content Preview"}
              </span>
              <button 
                onClick={toggleFullContent}
                className="text-xs text-text-secondary hover:text-primary"
              >
                {showFullContent ? "Collapse" : "View Full"}
              </button>
            </div>
            <div className={`overflow-y-auto transition-all duration-300 ${showFullContent ? 'max-h-96' : 'max-h-12'}`}>
              <pre className={`text-text-primary whitespace-pre-wrap text-sm font-sans ${!showFullContent && 'line-clamp-2'}`}>
                {block.content}
              </pre>
            </div>
          </div>
        )}
        
        {/* Show a placeholder when content is being generated */}
        {block.isGenerating && (
          <div className="mt-3 p-4 bg-surface rounded-md border border-border-secondary">
            <div className="flex flex-col items-center justify-center py-4">
              <FiLoader className="animate-spin text-primary mb-2" size={20} />
              <p className="text-text-secondary text-sm">Generating content...</p>
            </div>
          </div>
        )}
        
        {/* Show a prompt when no content has been generated yet */}
        {!block.content && !block.isGenerating && (
          <div className="mt-3 p-3 bg-surface rounded-md border border-border-secondary text-center">
            <button 
              onClick={() => onGenerate(index)}
              className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
            >
              Generate Content
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { SortableItem };