import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiX, FiEdit, FiMove, FiRefreshCw, FiLoader, FiCheck, FiMaximize2, FiMinimize2, FiPlay } from 'react-icons/fi';
import RegenerateModal from './RegenerateModal';

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
  const [editingContent, setEditingContent] = useState(false);
  const [title, setTitle] = useState(block.title);
  const [content, setContent] = useState(block.content || block.content);
  const [promptInput, setPromptInput] = useState(block.prompt || '');
  const [showFullContent, setShowFullContent] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [alternatives, setAlternatives] = useState([]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const saveEdit = (field, value) => {
    onEdit(index, field, value || (field === 'title' ? title : content));
    if (field === 'title') setEditingTitle(false);
    if (field === 'content') setEditingContent(false);
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
  
  const handlePromptEdit = (e) => {
    setPromptInput(e.target.value);
  };
  
  const savePromptEdit = () => {
    onEdit(index, 'prompt', promptInput);
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
        prompts.map(prompt => 
          // We're using a dummy response for the demo - in real implementation, use actual API
          simulateContentGeneration(prompt)
        )
      );
      
      setAlternatives(results);
      if (callback) callback(results);
    } catch (error) {
      console.error('Error generating alternatives:', error);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // This is just for demonstration - replace with actual AI generation
  const simulateContentGeneration = async (prompt) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Just demo content - replace with actual AI service in real implementation
    if (prompt.includes('Version 1')) {
      return `Key Findings:\n• Risk concentration in coastal areas exceeds industry benchmarks by 42%\n• Premiums inadequately reflect hurricane probability in Zone 3\n• Historical loss ratio trending upward (5.2% annually)\n\nRecommendations:\n1. Rebalance portfolio with 15% shift to inland properties\n2. Implement premium adjustments in high-risk zones\n3. Review reinsurance treaty terms before renewal`;
    } else if (prompt.includes('Version 2')) {
      return `The analysis reveals significant geographic concentration risk in the property portfolio. Specifically, 64% of insured properties are located in FEMA-designated high-risk flood zones, with 27% in areas that experienced hurricane-related losses in the past decade.\n\nHistorical performance data indicates progressive deterioration in loss ratios within coastal regions, rising from 62.1% in 2020 to 76.5% in current period. This trend correlates strongly (0.87 correlation coefficient) with increased severe weather events.\n\nPricing adequacy assessment demonstrates a systematic underpricing of hurricane risk. Current rate levels capture approximately 78% of expected losses based on updated catastrophe models.`;
    } else {
      return `Risk Assessment:\n✓ Portfolio diversification has improved in northern regions\n✗ Coastal exposure remains significantly above target thresholds\n✓ New underwriting guidelines show early positive results\n✗ Premium adequacy gap of 22% in hurricane-prone zones\n\nOpportunities:\n• Targeted non-renewals could improve risk profile by 18%\n• Precision pricing model could increase premium adequacy\n• Enhanced mitigation requirements show 24% loss reduction\n\nConclusions:\nWhile improvements are visible in certain segments, the overall geographic concentration presents continuing challenges that require immediate attention.`;
    }
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
          
          <div className="flex items-center gap-2">
            {!block.isGenerating && (
              <>
                {!block.isGenerated ? (
                  <button 
                    onClick={() => onGenerate(index)}
                    className="p-1 rounded hover:bg-background text-text-secondary hover:text-primary"
                    title="Generate content"
                  >
                    <FiPlay />
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowRegenerateModal(true)}
                    className="p-1 rounded hover:bg-background text-text-secondary hover:text-primary"
                    title="Regenerate content"
                  >
                    <FiRefreshCw />
                  </button>
                )}
              </>
            )}
            
            <button 
              onClick={() => setEditingTitle(true)}
              className="p-1 rounded text-text-secondary hover:text-primary hover:bg-background"
              title="Edit title"
            >
              <FiEdit />
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
        
        {/* Content display - either preview or full */}
        {block.content && !block.isGenerating && (
          <div className={`mt-3 bg-surface rounded-md border border-border-secondary transition-all duration-300 ${showFullContent ? 'p-4' : 'p-2'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-2">
                {showFullContent ? "Full Content" : "Content Preview"}
                <button 
                onClick={() => {
                  setContent(block.content || ''); // <-- sync from latest block content
                  setEditingContent(true);
                }}
                className="p-1 rounded text-text-secondary hover:text-primary"
                title="Edit content"
              >
                <FiEdit size={12} />
              </button>

              </span>
              <button 
                onClick={toggleFullContent}
                className="text-xs text-text-secondary hover:text-primary"
              >
                {showFullContent ? "Collapse" : "View Full"}
              </button>
            </div>
            
            {editingContent ? (
              <div className="w-full">
                <textarea
                  className="w-full bg-background border border-border-secondary text-text-primary rounded p-2 text-sm min-h-32"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={showFullContent ? 10 : 4}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => saveEdit('content')}
                    className="px-3 py-1 text-xs bg-primary text-background rounded"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className={`overflow-y-auto transition-all duration-300 ${showFullContent ? 'max-h-96' : 'max-h-12'}`}>
                <pre className={`text-text-primary whitespace-pre-wrap text-sm font-sans ${!showFullContent && 'line-clamp-2'}`}>
                  {block.content}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {/* Show a placeholder when content is being generated */}
        {block.isGenerating && (
          <div className="mt-3 p-4 bg-surface rounded-md border border-border-secondary">
            <div className="flex flex-col items-center justify-center py-4">
              <FiLoader className="animate-spin text-primary mb-2" size={20} />
              <p className="text-text-secondary text-sm">Analyzing data and generating insights...</p>
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
              Generate Analysis
            </button>
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