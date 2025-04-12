import { useState, useRef, useEffect } from 'react';
import { FiUpload, FiFileText, FiFile, FiGrid, FiX, FiCode, FiDownload, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// Import standardizers
import {
  standardizeExcel,
  standardizeMarkdown,
  standardizeCsv,
  standardizeJson
} from '../utils/standardizers';

const FileUploader = ({ onFilesAdded, onFilesCleared, onStartProcessing }) => {
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const fileInputRef = useRef(null);

  // Load SheetJS from CDN for Excel processing
  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.async = true;
      script.onload = () => {
        console.log('SheetJS loaded successfully');
        setLibraryLoaded(true);
      };
      script.onerror = () => console.error('Failed to load SheetJS');
      document.body.appendChild(script);
    } else {
      setLibraryLoaded(true);
    }
  }, []);

  // Notify parent component when files change
  useEffect(() => {
    if (onFilesAdded && files.length > 0) {
      onFilesAdded(files);
    }
  }, [files, onFilesAdded]);

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle file selection via input
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Process the uploaded files
  const handleFiles = (fileList) => {
    const supportedTypes = ['md', 'json', 'xlsx', 'csv'];
    
    const newFiles = Array.from(fileList).map(file => {
      // Get file extension
      const extension = file.name.split('.').pop().toLowerCase();
      
      // Check if file type is supported
      const isSupported = supportedTypes.includes(extension);
      
      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        extension,
        supported: isSupported,
        file: file,
        uploadDate: new Date(),
        status: isSupported ? 'ready' : 'unsupported',
        standardized: false,
      };
    });

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  // Remove file from list
  const removeFile = (fileId) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
    setCurrentFile(null);
    setCurrentFileName('');
    setProcessingProgress(0);
    
    // Notify parent component
    if (onFilesCleared) {
      onFilesCleared();
    }
  };

  // Trigger input click
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Read file content based on type
  const readFileContent = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      // Use appropriate reading method based on file type
      switch (file.extension) {
        case 'json':
        case 'md':
        case 'csv':
          reader.readAsText(file.file);
          break;
        case 'xlsx':
        case 'xls':
          // For Excel files, use ArrayBuffer for SheetJS
          reader.readAsArrayBuffer(file.file);
          break;
        default:
          reader.readAsText(file.file);
      }
    });
  };

  // Standardize a single file
  const standardizeFile = async (file) => {
    try {
      setCurrentFile(file);
      setCurrentFileName(file.name);
      setProcessingProgress(0);
      
      // Read file content
      const content = await readFileContent(file);
      setProcessingProgress(20);
      
      // Create file info object for standardizers
      const fileInfo = {
        name: file.name,
        type: file.type,
        size: file.size,
        extension: file.extension,
        uploadDate: file.uploadDate
      };
      
      // Progress callback function
      const updateProgress = (progress) => {
        // Adjust progress to start from 20% (after file read)
        // and end at 90% (reserving 10% for final steps)
        const adjustedProgress = 20 + (progress * 0.7);
        setProcessingProgress(Math.min(90, Math.round(adjustedProgress)));
      };
      
      // Apply the appropriate standardizer based on file extension
      let jsonData;
      
      switch (file.extension) {
        case 'json':
          jsonData = await standardizeJson(content, fileInfo, updateProgress);
          break;
        case 'md':
          jsonData = await standardizeMarkdown(content, fileInfo, updateProgress);
          break;
        case 'csv':
          jsonData = await standardizeCsv(content, fileInfo, updateProgress);
          break;
        case 'xlsx':
        case 'xls':
          if (!libraryLoaded) {
            throw new Error('SheetJS library not loaded');
          }
          jsonData = await standardizeExcel(content, fileInfo, updateProgress);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.extension}`);
      }
      
      // Final processing steps
      setProcessingProgress(100);
      
      // Update the file in the files array
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                standardized: true, 
                jsonData, 
                standardizedAt: new Date().toISOString() 
              } 
            : f
        )
      );
      
      return true;
    } catch (error) {
      console.error(`Error standardizing ${file.name}:`, error);
      
      // Mark file as failed
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                standardized: false, 
                error: error.message, 
                standardizedAt: new Date().toISOString() 
              } 
            : f
        )
      );
      
      return false;
    }
  };

  // Standardize all files
  const standardizeAllFiles = async () => {
    if (!libraryLoaded) {
      alert('Please wait for SheetJS to load before standardizing files.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const filesToProcess = files.filter(file => file.supported && !file.standardized);
      
      for (const file of filesToProcess) {
        await standardizeFile(file);
      }
      
      // After processing all files, notify parent component
      const standardizedFiles = files.filter(file => file.standardized);
      if (onStartProcessing && standardizedFiles.length > 0) {
        onStartProcessing(standardizedFiles);
      }
    } catch (error) {
      console.error('Error during standardization:', error);
    } finally {
      setIsProcessing(false);
      setCurrentFile(null);
      setCurrentFileName('');
      setProcessingProgress(0);
    }
  };

  // View standardized file in new tab
  const viewFile = (file) => {
    if (file.standardized && file.jsonData) {
      const jsonContent = JSON.stringify(file.jsonData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL object after opening
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get icon based on file extension
  const getFileIcon = (extension) => {
    switch(extension) {
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FiGrid />;
      case 'md':
        return <FiFileText />;
      case 'json':
        return <FiCode />;
      default:
        return <FiFile />;
    }
  };

  return (
    <div className="bg-surface border border-border-primary rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FiUpload className="w-5 h-5 mr-2 text-text-secondary" />
          <h2 className="text-xl font-medium">Upload Files</h2>
        </div>
        
        {libraryLoaded ? (
          <span className="text-xs text-status-success flex items-center">
            <FiCheckCircle className="mr-1" /> SheetJS Loaded
          </span>
        ) : (
          <span className="text-xs text-status-warning flex items-center">
            <FiAlertCircle className="mr-1" /> Loading SheetJS...
          </span>
        )}
      </div>
      
      {/* File type information */}
      <div className="mb-4 text-text-secondary text-sm">
        <p>Supported formats: <span className="font-medium">.md, .json, .xlsx, .csv</span></p>
      </div>
      
      {/* Drag and drop area */}
      <div 
        className="mt-4 border-2 border-dashed rounded-lg p-8 transition-all text-center border-border-secondary hover:border-text-secondary"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple
          accept=".md,.json,.xlsx,.csv"
          className="hidden" 
          onChange={handleChange}
        />
        
        <FiUpload className="mx-auto h-12 w-12 text-text-secondary mb-4" />
        <p className="text-text-primary mb-2">
          Drag and drop files here, or click to select files
        </p>
        <p className="text-text-secondary text-sm mb-4">
          All files will be standardized to JSON format
        </p>
        <button 
          onClick={onButtonClick}
          className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all"
        >
          Select Files
        </button>
      </div>
      
      {/* Processing status */}
      {isProcessing && currentFile && (
        <div className="mt-6 p-4 border border-border-secondary rounded-lg">
          <p className="mb-2">Standardizing: {currentFileName}</p>
          <div className="w-full bg-background rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Files</h3>
            <div className="space-x-2">
              <button 
                className="px-3 py-1 text-sm bg-surface border border-border-primary rounded hover:bg-background transition-all"
                onClick={clearFiles}
              >
                Clear All
              </button>
              <button 
                className="px-3 py-1 text-sm bg-primary text-background rounded hover:opacity-90 transition-all"
                onClick={standardizeAllFiles}
                disabled={isProcessing || !libraryLoaded || !files.some(file => file.supported && !file.standardized)}
              >
                {isProcessing ? 'Processing...' : 'Standardize All'}
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {files.map(file => (
              <div 
                key={file.id}
                className={`flex items-center justify-between p-3 rounded border
                  ${!file.supported ? 'border-status-error bg-status-error bg-opacity-5' : 
                    file.standardized ? 'border-status-success bg-status-success bg-opacity-5' : 'border-border-primary'}`}
              >
                <div className="flex items-center">
                  <span className={`mr-3 ${file.standardized ? 'text-status-success' : 'text-text-secondary'}`}>
                    {getFileIcon(file.extension)}
                  </span>
                  <div>
                    <p className="text-text-primary text-sm">{file.name}</p>
                    <p className="text-text-secondary text-xs">
                      {formatBytes(file.size)} • {file.extension.toUpperCase()}
                      {file.standardized && <span className="text-status-success ml-2">• Standardized</span>}
                      {file.error && <span className="text-status-error ml-2">• Error: {file.error}</span>}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.standardized && (
                    <button 
                      onClick={() => viewFile(file)}
                      className="text-text-secondary hover:text-primary transition-colors text-sm flex items-center px-2 py-1 border border-border-secondary rounded"
                    >
                      <FiCode className="mr-1" /> View
                    </button>
                  )}
                  
                  {!file.standardized && file.supported && !isProcessing && (
                    <button 
                      onClick={() => standardizeFile(file)}
                      className="text-text-secondary hover:text-primary transition-colors text-sm flex items-center px-2 py-1 border border-border-secondary rounded"
                    >
                      <FiCode className="mr-1" /> Standardize
                    </button>
                  )}
                  
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="text-text-secondary hover:text-status-error transition-colors"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;