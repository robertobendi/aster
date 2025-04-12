import { useState } from 'react';
import { FiDatabase, FiCode, FiDownload, FiExternalLink, FiGrid } from 'react-icons/fi';
import FileUploader from '../FileUploader';

const FilesTab = () => {
  // State for processing and output
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('idle'); // 'idle', 'processing', 'complete'
  const [processedData, setProcessedData] = useState(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [selectedJsonFile, setSelectedJsonFile] = useState(null);

  // Handle when files are added in the FileUploader component
  const handleFilesAdded = (files) => {
    setUploadedFiles(files);
    setProcessingStatus('idle');
    setProcessedData(null);
    setShowJsonPreview(false);
    setSelectedJsonFile(null);
  };

  // Handle when files are cleared
  const handleFilesCleared = () => {
    setUploadedFiles([]);
    setProcessingStatus('idle');
    setProcessedData(null);
    setShowJsonPreview(false);
    setSelectedJsonFile(null);
  };

  // Receive standardized files without processing
  const startProcessing = (standardizedFiles) => {
    setProcessingStatus('complete');
    
    setProcessedData({
      fileCount: standardizedFiles.length,
      totalSize: standardizedFiles.reduce((sum, file) => sum + file.size, 0),
      types: Array.from(new Set(standardizedFiles.map(file => file.extension))),
      timestamp: new Date().toISOString(),
      standardizedFiles: standardizedFiles.map(file => ({
        id: file.id,
        name: file.name,
        format: file.jsonData?.format || 'unknown',
        size: file.jsonData ? JSON.stringify(file.jsonData).length : 0,
        jsonData: file.jsonData
      }))
    });
  };

  // Toggle JSON preview for a specific file
  const toggleJsonPreview = (fileId) => {
    if (selectedJsonFile?.id === fileId) {
      setShowJsonPreview(false);
      setSelectedJsonFile(null);
    } else {
      const file = processedData.standardizedFiles.find(f => f.id === fileId);
      if (file) {
        setSelectedJsonFile(file);
        setShowJsonPreview(true);
      }
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

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* FileUploader Component */}
      <FileUploader 
        onFilesAdded={handleFilesAdded}
        onFilesCleared={handleFilesCleared}
        onStartProcessing={startProcessing}
      />
      
      {/* Output Area */}
      <div className="bg-surface border border-border-primary rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FiDatabase className="w-5 h-5 mr-2 text-text-secondary" />
          <h2 className="text-xl font-medium">Output</h2>
        </div>
        
        <div className="border border-border-secondary rounded-lg p-8 flex flex-col min-h-[200px]">
          {!processedData ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-text-secondary text-center">
                Processed data will be displayed here
              </p>
            </div>
          ) : (
            <div className="w-full">
              {showJsonPreview && selectedJsonFile ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-text-primary text-lg">JSON Preview: {selectedJsonFile.name}</h3>
                    <button 
                      onClick={() => setShowJsonPreview(false)}
                      className="px-3 py-1 text-sm bg-surface border border-border-primary rounded hover:bg-background transition-all"
                    >
                      Back to Results
                    </button>
                  </div>
                  
                  <div className="bg-background p-4 rounded border border-border-secondary mb-4 overflow-auto max-h-80">
                    <pre className="text-sm text-text-primary whitespace-pre-wrap">
                      {JSON.stringify(selectedJsonFile.jsonData, null, 2)}
                    </pre>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const jsonContent = JSON.stringify(selectedJsonFile.jsonData, null, 2);
                          const blob = new Blob([jsonContent], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        }}
                        className="px-4 py-2 bg-primary text-background rounded hover:opacity-90 transition-all flex items-center"
                      >
                        <FiExternalLink className="mr-2" /> Open in New Tab
                      </button>
                      
                      <button 
                        onClick={() => {
                          const jsonContent = JSON.stringify(selectedJsonFile.jsonData, null, 2);
                          const blob = new Blob([jsonContent], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${selectedJsonFile.name.split('.')[0]}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center"
                      >
                        <FiDownload className="mr-2" /> Download JSON
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-text-primary text-lg mb-4 text-center">Standardization Results</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border border-border-secondary rounded">
                      <p className="text-text-secondary text-sm mb-1">Files Processed</p>
                      <p className="text-text-primary text-xl">{processedData.fileCount}</p>
                    </div>
                    
                    <div className="p-4 border border-border-secondary rounded">
                      <p className="text-text-secondary text-sm mb-1">Total Size</p>
                      <p className="text-text-primary text-xl">
                        {formatBytes(processedData.totalSize)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-border-secondary rounded mb-6">
                    <p className="text-text-secondary text-sm mb-2">File Types</p>
                    <div className="flex flex-wrap gap-2">
                      {processedData.types.map(type => (
                        <span 
                          key={type}
                          className="px-2 py-1 bg-background rounded text-xs text-text-primary"
                        >
                          {type.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {processedData.standardizedFiles.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-md font-medium mb-3 flex items-center">
                        <FiCode className="mr-2" />
                        Standardized JSON Files
                      </h4>
                      <div className="space-y-2">
                        {processedData.standardizedFiles.map(file => (
                          <div 
                            key={file.id}
                            className="p-3 border border-border-secondary rounded flex items-center justify-between hover:bg-background cursor-pointer transition-all"
                            onClick={() => toggleJsonPreview(file.id)}
                          >
                            <div>
                              <p className="text-text-primary">{file.name}</p>
                              <p className="text-text-secondary text-xs">
                                Format: {file.format} • Size: {formatBytes(file.size)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button className="text-xs px-2 py-1 flex items-center bg-surface border border-border-primary rounded">
                                <FiCode className="mr-1" /> View JSON
                              </button>
                              {file.format === 'excel' && (
                                <button className="text-xs px-2 py-1 flex items-center bg-surface border border-border-primary rounded text-primary">
                                  <FiGrid className="mr-1" /> Excel
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => {
                        const allData = {
                          exportDate: new Date().toISOString(),
                          files: processedData.standardizedFiles.map(file => file.jsonData)
                        };
                        const jsonContent = JSON.stringify(allData, null, 2);
                        const blob = new Blob([jsonContent], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'standardized-files.json';
                        document.body.appendChild(a);
                        a.click();
                      }}
                      className="px-4 py-2 bg-primary text-background rounded hover:opacity-90 transition-all flex items-center"
                    >
                      <FiDownload className="mr-2" /> Export All as JSON
                    </button>
                    
                    <button 
                      onClick={() => {
                        alert('In a production environment, this would create a ZIP file with individual JSON files for each standardized document.');
                      }}
                      className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center"
                    >
                      <FiCode className="mr-2" /> View All Files
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilesTab;