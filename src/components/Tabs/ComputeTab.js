import { useState, useEffect, useRef } from 'react';
import { FiCpu, FiSend, FiFile, FiPlus, FiX, FiLoader, FiMaximize2, FiMinimize2, FiRefreshCw, FiInfo, FiCode, FiDownload, FiPlay } from 'react-icons/fi';
import aiService from '../../services/aiService';
import simpleStorage from '../../utils/simpleStorage';

const ComputeTab = () => {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [currentModel, setCurrentModel] = useState('Loading...');
  const [debugMode, setDebugMode] = useState(false);
  const [lastPromptData, setLastPromptData] = useState(null);
  const [useStreaming, setUseStreaming] = useState(false);
  
  const chatContainerRef = useRef(null);
  const promptInputRef = useRef(null);
  
  // Load model and settings from storage
  const loadModel = async () => {
    try {
      const savedModel = await simpleStorage.getItem('ollama_model');
      if (savedModel) {
        setCurrentModel(savedModel);
      } else {
        setCurrentModel('phi3:medium'); // Default model
      }
      
      const streamingSetting = await simpleStorage.getItem('use_streaming');
      setUseStreaming(streamingSetting === true);
    } catch (error) {
      console.error('Failed to load model info:', error);
      setCurrentModel('Unknown');
    }
  };
  
  // Load files from storage
  const loadFiles = async () => {
    try {
      const filesFromStorage = await simpleStorage.getItem('standardized_files');
      if (Array.isArray(filesFromStorage) && filesFromStorage.length > 0) {
        setFiles(filesFromStorage);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadFiles();
    loadModel();
  }, []);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation, processingProgress]);
  
  // Save conversation
  useEffect(() => {
    if (conversation.length > 0) {
      const saveConversation = async () => {
        try {
          await simpleStorage.setItem('aster_conversation', conversation);
        } catch (error) {
          console.error('Failed to save conversation:', error);
        }
      };
      
      saveConversation();
    }
  }, [conversation]);
  
  // Load conversation
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const savedConversation = await simpleStorage.getItem('aster_conversation');
        if (savedConversation && savedConversation.length > 0) {
          setConversation(savedConversation);
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      }
    };
    
    loadConversation();
  }, []);
  
  // Toggle file selection
  const toggleFile = (file) => {
    if (selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles(prev => [...prev, file]);
    }
  };
  
  // Check if file is selected
  const isSelected = (fileId) => {
    return selectedFiles.some(file => file.id === fileId);
  };
  
  // Progress callback for AI processing
  const updateProgress = (progressMessage) => {
    setProcessingProgress(progressMessage);
  };
  
  // Prepare debugging info for prompt
  const preparePromptForDebug = async (userPrompt, files, defaultContext) => {
    // Create a simplified version of files to avoid memory issues
    const simplifiedFiles = files.map(file => {
      // Extract basic info without the full content for debug data
      const { jsonData, ...fileBasics } = file;
      return {
        ...fileBasics,
        hasContent: !!jsonData,
        format: jsonData?.format || 'unknown'
      };
    });
    
    const debugData = {
      prompt: userPrompt,
      context: defaultContext,
      selectedFiles: simplifiedFiles,
      model: currentModel,
      timestamp: new Date().toISOString()
    };
    
    setLastPromptData(debugData);
    
    // Log to console
    if (debugMode) {
      console.log('DEBUG - Sending prompt to AI:', {
        ...debugData,
        totalPromptLength: userPrompt.length + 
                          (defaultContext ? defaultContext.length : 0) +
                          files.reduce((sum, f) => sum + (f.size || 0), 0)
      });
    }
    
    return debugData;
  };
  
  // Toggle streaming mode
  const toggleStreaming = async () => {
    const newValue = !useStreaming;
    setUseStreaming(newValue);
    await simpleStorage.setItem('use_streaming', newValue);
    console.log(`Streaming mode ${newValue ? 'enabled' : 'disabled'}`);
  };
  
  // Send message to AI
  const sendMessage = async () => {
    if (!prompt.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);
    setPrompt('');
    setIsProcessing(true);
    setProcessingProgress('Starting...');
    setError(null);
    
    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      // Get context
      const defaultContext = await simpleStorage.getItem('aster_context') || '';
      
      // Debug info - store the simplified file objects
      await preparePromptForDebug(prompt, selectedFiles, defaultContext);
      
      // Query AI with abort signal and progress callback
      const response = await aiService.query(
        prompt, 
        selectedFiles, 
        defaultContext, 
        controller.signal, 
        null, // use default model
        updateProgress // progress callback
      );
      
      // Add AI response if not aborted
      const aiResponse = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error querying AI:', error);
      
      // Don't show error message if request was deliberately cancelled
      if (error.name === 'AbortError') {
        const cancelMessage = {
          role: 'system',
          content: 'Request cancelled',
          timestamp: new Date(),
          isCancelled: true
        };
        setConversation(prev => [...prev, cancelMessage]);
      } else {
        setError(error.message);
        
        const errorMessage = {
          role: 'system',
          content: `Error: ${error.message}`,
          timestamp: new Date(),
          isError: true
        };
        
        setConversation(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsProcessing(false);
      setProcessingProgress('');
      setAbortController(null);
      if (promptInputRef.current) {
        promptInputRef.current.focus();
      }
    }
  };
  
  // Cancel ongoing request
  const cancelRequest = () => {
    if (abortController) {
      setProcessingProgress('Cancelling request...');
      abortController.abort();
    }
  };
  
  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Clear conversation
  const clearConversation = () => {
    if (window.confirm('Are you sure you want to clear the entire conversation?')) {
      setConversation([]);
      simpleStorage.removeItem('aster_conversation').catch(error => {
        console.error('Failed to clear conversation:', error);
      });
    }
  };
  
  // Refresh files
  const refreshFiles = async () => {
    try {
      await loadFiles();
      await loadModel();
    } catch (error) {
      console.error('Error refreshing files:', error);
    }
  };
  
  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    if (!debugMode) {
      console.log('DEBUG MODE ENABLED - Full file content will be sent to the AI');
    } else {
      console.log('DEBUG MODE DISABLED');
    }
  };
  
  // View last prompt details
  const viewLastPromptDetails = () => {
    if (lastPromptData) {
      const formattedData = JSON.stringify(lastPromptData, null, 2);
      const blob = new Blob([formattedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      alert('No prompt data available yet. Send a message first.');
    }
  };
  
  // Download last prompt data
  const downloadLastPromptData = () => {
    if (lastPromptData) {
      const formattedData = JSON.stringify(lastPromptData, null, 2);
      const blob = new Blob([formattedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt_data_${new Date().toISOString().replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      alert('No prompt data available yet. Send a message first.');
    }
  };
  
  return (
    <div className={`grid grid-cols-1 gap-8 ${fullscreen ? 'fixed inset-0 z-50 p-4 bg-background' : ''}`}>
      <div className={`bg-surface border border-border-primary rounded-lg flex flex-col ${fullscreen ? 'h-full' : 'min-h-[600px]'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border-secondary">
          <div className="flex items-center">
            <FiCpu className="w-5 h-5 mr-2 text-text-secondary" />
            <h2 className="text-xl font-medium">AI Compute</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Streaming mode toggle */}
            <button
              className={`px-3 py-1 text-sm rounded transition-all flex items-center
                ${useStreaming ? 'bg-primary text-background' : 'bg-surface border border-border-primary text-text-primary'}`}
              onClick={toggleStreaming}
              title={useStreaming ? 'Disable Streaming' : 'Enable Streaming'}
            >
              <FiPlay className="mr-1" />
              Stream
            </button>
            
            {/* Debug mode toggle */}
            <button
              className={`px-3 py-1 text-sm rounded transition-all flex items-center
                ${debugMode ? 'bg-status-warning text-background' : 'bg-surface border border-border-primary text-text-primary'}`}
              onClick={toggleDebugMode}
              title={debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
            >
              <FiCode className="mr-1" />
              Debug
            </button>
            
            {/* File selector toggle */}
            <button
              className={`px-3 py-1 text-sm rounded transition-all flex items-center
                ${showFileSelector ? 'bg-primary text-background' : 'bg-surface border border-border-primary text-text-primary'}`}
              onClick={() => setShowFileSelector(!showFileSelector)}
            >
              <FiFile className="mr-1" />
              Files ({selectedFiles.length})
            </button>
            
            <button
              className="px-2 py-1 bg-surface border border-border-primary rounded hover:bg-background transition-all"
              onClick={refreshFiles}
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
            
            <button
              className="px-2 py-1 bg-surface border border-border-primary rounded hover:bg-background transition-all"
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </div>
        
        <div className="flex flex-grow overflow-hidden">
          <div className="flex-grow flex flex-col">
            <div 
              ref={chatContainerRef}
              className="flex-grow p-4 overflow-y-auto space-y-4"
            >
              {conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                  <FiCpu className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-center max-w-md">
                    Start a conversation with the AI. Add files for context using the Files button.
                  </p>
                </div>
              ) : (
                conversation.map((message, index) => (
                  <div 
                    key={index}
                    className={`rounded-lg p-4 max-w-4xl ${
                      message.role === 'user' 
                        ? 'bg-background border border-border-secondary ml-auto' 
                        : message.role === 'assistant'
                          ? 'bg-primary/10 border border-primary/20'
                          : 'bg-status-error/10 border border-status-error/20 text-status-error'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">
                        {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI' : 'System'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              
              {isProcessing && (
                <div className="rounded-lg p-4 bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <FiLoader className="animate-spin mr-2" />
                      <span>{processingProgress || 'Processing...'}</span>
                    </div>
                    <button 
                      onClick={cancelRequest}
                      className="px-2 py-1 text-xs bg-surface border border-border-primary rounded hover:bg-background transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Progress bar that pulses */}
                  <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse" style={{width: '100%'}}></div>
                  </div>
                </div>
              )}
              
              {error && !isProcessing && (
                <div className="rounded-lg p-4 bg-status-error/10 border border-status-error/20 text-status-error">
                  <div className="flex items-center">
                    <FiRefreshCw className="mr-2" />
                    <span>Error: {error}</span>
                  </div>
                  <p className="mt-2 text-sm">
                    Please check that Ollama is running and has the {currentModel} model installed.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border-secondary">
              <div className="flex items-start">
                <textarea
                  ref={promptInputRef}
                  className="flex-grow p-3 bg-background border border-border-secondary rounded-lg focus:outline-none focus:border-primary resize-none"
                  placeholder="Ask a question..."
                  rows="3"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isProcessing}
                />
                <button
                  className="ml-2 p-3 bg-primary text-background rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                  onClick={sendMessage}
                  disabled={isProcessing || !prompt.trim()}
                >
                  <FiSend />
                </button>
              </div>
              
              <div className="mt-2 text-xs text-text-secondary flex items-center justify-between">
                <div className="flex items-center">
                  Using: Ollama <span className="text-text-primary font-mono bg-background px-1 py-0.5 rounded ml-1">{currentModel}</span>
                  {debugMode && lastPromptData && (
                    <div className="flex ml-2">
                      <button
                        className="text-status-warning hover:text-status-error flex items-center mr-2"
                        onClick={viewLastPromptDetails}
                        title="View simplified prompt data"
                      >
                        <FiInfo className="mr-1" /> View
                      </button>
                      <button
                        className="text-status-warning hover:text-status-error flex items-center"
                        onClick={downloadLastPromptData}
                        title="Download full prompt data with file content"
                      >
                        <FiDownload className="mr-1" /> Download
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  className="text-text-secondary hover:text-status-error"
                  onClick={clearConversation}
                >
                  Clear conversation
                </button>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedFiles.map(file => (
                    <div key={file.id} className="bg-background text-text-primary text-xs rounded px-2 py-1 flex items-center">
                      <FiFile className="mr-1" />
                      {file.name}
                      <button
                        className="ml-1 text-text-secondary hover:text-status-error transition-colors"
                        onClick={() => toggleFile(file)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-2 flex justify-between items-center">
                {debugMode && (
                  <span className="text-xs text-status-warning flex items-center">
                    <FiCode className="mr-1" /> Debug Mode On
                  </span>
                )}
                
                {useStreaming && (
                  <span className="text-xs text-primary flex items-center">
                    <FiPlay className="mr-1" /> Streaming Mode On
                  </span>
                )}
                
                {processingProgress && isProcessing ? (
                  <span className="text-xs text-text-secondary ml-auto">
                    {processingProgress}
                  </span>
                ) : (
                  <span className="text-xs text-text-secondary ml-auto">
                    {isProcessing ? 'Processing...' : 'Press Enter to send'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {showFileSelector && (
            <div className="w-64 border-l border-border-secondary overflow-hidden flex flex-col">
              <div className="p-3 border-b border-border-secondary flex justify-between items-center">
                <h3 className="font-medium text-sm">Context Files ({files.length})</h3>
                <button
                  className="text-text-secondary hover:text-status-error transition-colors"
                  onClick={() => setShowFileSelector(false)}
                >
                  <FiX />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {files.length === 0 ? (
                  <div className="text-center p-4 text-text-secondary text-sm">
                    <p>No files available.</p>
                    <button 
                      onClick={refreshFiles}
                      className="mt-2 px-2 py-1 bg-surface border border-border-primary rounded text-xs hover:bg-background transition-all"
                    >
                      <FiRefreshCw className="mr-1 inline-block" /> Refresh Files
                    </button>
                  </div>
                ) : (
                  files.map(file => (
                    <div
                      key={file.id}
                      className={`p-2 rounded text-sm cursor-pointer transition-colors
                        ${isSelected(file.id) 
                          ? 'bg-primary/20 border border-primary/30' 
                          : 'hover:bg-background'}`}
                      onClick={() => toggleFile(file)}
                    >
                      <div className="flex items-center">
                        <FiFile className="mr-2 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-border-secondary">
                <button
                  className="w-full px-2 py-1 bg-background text-text-primary text-sm rounded hover:bg-border-secondary transition-all flex items-center justify-center"
                  onClick={() => {
                    const filesTabButton = document.querySelector('[value="files"]');
                    if (filesTabButton) filesTabButton.click();
                  }}
                >
                  <FiPlus className="mr-1" />
                  Add Files
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComputeTab;