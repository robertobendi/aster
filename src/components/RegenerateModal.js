import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiLoader, FiCheck } from 'react-icons/fi';

const RegenerateModal = ({ 
  isOpen, 
  onClose, 
  blockTitle, 
  initialPrompt, 
  onRegenerate, 
  onSelect,
  isGenerating
}) => {
  // The user can edit the prompt in the modal
  const [customPrompt, setCustomPrompt] = useState(initialPrompt);
  // We'll store partial results as they come in
  const [alternatives, setAlternatives] = useState([]);
  // Track which version is selected
  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleRegenerate = () => {
    // Clear out any old results
    setAlternatives([]);
    setSelectedIndex(null);

    // We'll call the parent's `onRegenerate`, 
    // providing 2 callbacks: partial result & final result

    onRegenerate(
      customPrompt,
      // partialCb: called each time a version finishes
      (result, idx) => {
        // Insert or update the partial result in local state
        setAlternatives((prev) => {
          const newArr = [...prev];
          newArr[idx] = result;
          return newArr;
        });
      },
      // doneCb: called after all versions are finished
      (allResults) => {
        // If you want to do anything after final completion, do it here
        // e.g. setAlternatives(allResults) -> not strictly needed if you
        // already added them above. 
      }
    );
  };

  const handleSelect = () => {
    if (selectedIndex !== null && alternatives[selectedIndex]) {
      // Return whichever version is selected back to the parent
      onSelect(alternatives[selectedIndex]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="relative z-10 bg-background border border-border-primary rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-text-primary">Regenerate Content</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-text-secondary hover:text-status-error hover:bg-surface transition-all"
          >
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div>
          <div className="mb-6">
            <h3 className="font-medium text-text-primary mb-2">
              Block: {blockTitle}
            </h3>
            <label className="block text-text-secondary text-sm mb-2">
              Customize prompt for alternative content
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-3 bg-surface border border-border-secondary rounded focus:outline-none focus:border-primary text-primary min-h-24"
              placeholder="Describe what you want in the regenerated content..."
              disabled={isGenerating}
            />

            <div className="mt-3 flex justify-end">
              <button
                onClick={handleRegenerate}
                disabled={isGenerating || !customPrompt.trim()}
                className="px-4 py-2 bg-primary text-background rounded hover:opacity-90 transition-all disabled:opacity-50 flex items-center"
              >
                {isGenerating ? (
                  <>
                    <FiLoader className="animate-spin mr-2" /> 
                    Generating...
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" /> 
                    Generate Alternatives
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Show each alternative as soon as it arrives */}
          {alternatives.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-text-primary mb-4">
                Alternative Versions
              </h3>
              <div className="space-y-4">
                {alternatives.map((alt, idx) => {
                  if (!alt) {
                    // This version hasn't arrived yet
                    return (
                      <div 
                        key={idx}
                        className="p-4 border border-border-secondary rounded-lg"
                      >
                        <p className="text-sm text-text-secondary">
                          Generating version {idx + 1}...
                        </p>
                      </div>
                    );
                  }

                  // If we have text, show it
                  return (
                    <div
                      key={idx}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedIndex === idx
                          ? 'border-primary bg-primary/5'
                          : 'border-border-secondary hover:border-text-secondary'
                      }`}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-text-primary">
                          Version {idx + 1}
                        </span>
                        {selectedIndex === idx && (
                          <span className="text-primary">
                            <FiCheck />
                          </span>
                        )}
                      </div>
                      <pre className="text-text-secondary text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {alt}
                      </pre>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSelect}
                  disabled={selectedIndex === null || !alternatives[selectedIndex]}
                  className="px-4 py-2 bg-primary text-background rounded hover:opacity-90 transition-all disabled:opacity-50 flex items-center"
                >
                  <FiCheck className="mr-2" /> 
                  Use Selected Version
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RegenerateModal;
