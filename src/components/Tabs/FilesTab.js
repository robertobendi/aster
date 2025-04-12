import { useState } from 'react';
import { FiCode, FiDownload, FiExternalLink, FiGrid, FiFileText, FiFile, FiX } from 'react-icons/fi';
import FileUploader from '../FileUploader';

const FilesTab = () => {
  // State for processing and output
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('idle'); // 'idle', 'processing', 'complete'
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [selectedJsonFile, setSelectedJsonFile] = useState(null);

  // Handle when files are added in the FileUploader component
  const handleFilesAdded = (files) => {
    setUploadedFiles(files);
    setProcessingStatus('idle');
    setShowJsonPreview(false);
    setSelectedJsonFile(null);
  };

  // Handle when files are cleared
  const handleFilesCleared = () => {
    setUploadedFiles([]);
    setProcessingStatus('idle');
    setShowJsonPreview(false);
    setSelectedJsonFile(null);
  };

  // Receive standardized files without processing
  const startProcessing = (standardizedFiles) => {
    setProcessingStatus('complete');
    // We don't need to transform data into processedData anymore
    // Just use the standardized files directly
  };

  // Toggle JSON preview for a specific file
  const toggleJsonPreview = (file) => {
    if (selectedJsonFile?.id === file.id) {
      setShowJsonPreview(false);
      setSelectedJsonFile(null);
    } else {
      setSelectedJsonFile(file);
      setShowJsonPreview(true);
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

  // Filter standardized files
  const standardizedFiles = uploadedFiles.filter(file => file.standardized);

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* FileUploader Component */}
      <FileUploader 
        onFilesAdded={handleFilesAdded}
        onFilesCleared={handleFilesCleared}
        onStartProcessing={startProcessing}
      />
      
      {/* Standardized Files Section - Replaces the output area */}
      {showJsonPreview && selectedJsonFile ? (
        <div className="bg-surface border border-border-primary rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-text-primary text-lg">JSON Preview: {selectedJsonFile.name}</h3>
            <button 
              onClick={() => setShowJsonPreview(false)}
              className="px-3 py-1 text-sm bg-surface border border-border-primary rounded hover:bg-background transition-all"
            >
              Back to Files
            </button>
          </div>
          
          <div className="bg-background p-4 rounded border border-border-secondary mb-4 overflow-auto max-h-96">
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
      ) : standardizedFiles.length > 0 ? (
        <div className="bg-surface border border-border-primary rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium">Standardized Files</h3>
            <button 
              onClick={() => {
                if (standardizedFiles.length > 0) {
                  const allData = {
                    exportDate: new Date().toISOString(),
                    files: standardizedFiles.map(file => file.jsonData)
                  };
                  const jsonContent = JSON.stringify(allData, null, 2);
                  const blob = new Blob([jsonContent], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'standardized-files.json';
                  document.body.appendChild(a);
                  a.click();
                }
              }}
              className="px-3 py-1 text-sm bg-primary text-background rounded hover:opacity-90 transition-all flex items-center"
            >
              <FiDownload className="mr-1" /> Export All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardizedFiles.map(file => (
              <div 
                key={file.id}
                className="p-4 border border-border-secondary rounded hover:border-text-secondary transition-all"
              >
                <div className="flex items-center mb-3">
                  <span className="text-status-success mr-2 text-lg">
                    {getFileIcon(file.extension)}
                  </span>
                  <div className="truncate flex-1">
                    <p className="text-text-primary font-medium truncate">{file.name}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-text-secondary">
                  <div>
                    <p>{formatBytes(file.size)}</p>
                    <p className="mt-1">Format: {file.jsonData?.format || 'unknown'}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleJsonPreview(file);
                      }}
                      className="px-2 py-1 bg-surface border border-border-primary rounded hover:bg-background flex items-center hover:text-primary transition-colors"
                    >
                      <FiCode className="mr-1" /> View JSON
                    </button>
                    
                    {file.extension === 'xlsx' && file.jsonData?.sheets && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Create a simplified Excel-like view as a table
                          const firstSheetName = file.jsonData.sheetNames?.[0];
                          const firstSheetData = firstSheetName ? file.jsonData.sheets[firstSheetName].data : [];
                          
                          const tableContent = `
                            <html>
                              <head>
                                <title>${file.name} - Data View</title>
                                <style>
                                  body { font-family: sans-serif; background: #111; color: #fff; padding: 20px; }
                                  table { border-collapse: collapse; width: 100%; }
                                  th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                                  th { background: #222; }
                                  h2 { margin-top: 0; }
                                </style>
                              </head>
                              <body>
                                <h2>${file.name} - Sheet: ${firstSheetName || 'Unknown'}</h2>
                                <table>
                                  ${firstSheetData.length > 0 ? `
                                    <tr>
                                      ${Object.keys(firstSheetData[0]).map(header => `<th>${header}</th>`).join('')}
                                    </tr>
                                    ${firstSheetData.slice(0, 100).map(row => `
                                      <tr>
                                        ${Object.values(row).map(cell => `<td>${cell !== null ? cell : ''}</td>`).join('')}
                                      </tr>
                                    `).join('')}
                                  ` : '<tr><td>No data available</td></tr>'}
                                </table>
                                ${firstSheetData.length > 100 ? '<p>Showing first 100 rows only</p>' : ''}
                              </body>
                            </html>
                          `;
                          
                          const blob = new Blob([tableContent], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        }}
                        className="px-2 py-1 bg-surface border border-border-primary rounded hover:bg-background flex items-center hover:text-primary transition-colors"
                      >
                        <FiGrid className="mr-1" /> View Data
                      </button>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Download JSON
                        const jsonContent = JSON.stringify(file.jsonData, null, 2);
                        const blob = new Blob([jsonContent], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${file.name.split('.')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-2 py-1 bg-surface border border-border-primary rounded hover:bg-background flex items-center hover:text-primary transition-colors"
                    >
                      <FiDownload className="mr-1" /> Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Show a summary of file types and stats at the bottom */}
          <div className="mt-6 pt-4 border-t border-border-secondary">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-text-secondary">
                <span className="text-sm">
                  {standardizedFiles.length} file{standardizedFiles.length !== 1 ? 's' : ''} standardized
                </span>
                <div className="mt-1 text-xs flex flex-wrap gap-2">
                  {Array.from(new Set(standardizedFiles.map(file => file.extension))).map(type => (
                    <span 
                      key={type}
                      className="px-2 py-1 bg-background rounded text-text-primary"
                    >
                      {type.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    // Create a data summary as HTML
                    const summaryContent = `
                      <html>
                        <head>
                          <title>Standardized Files Summary</title>
                          <style>
                            body { font-family: sans-serif; background: #111; color: #fff; padding: 20px; }
                            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                            th, td { border: 1px solid #333; padding: 8px; text-align: left; }
                            th { background: #222; }
                            h2, h3 { margin-top: 0; }
                            .file-section { margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 20px; }
                          </style>
                        </head>
                        <body>
                          <h2>Standardized Files Summary</h2>
                          <p>Generated: ${new Date().toLocaleString()}</p>
                          
                          <div class="file-section">
                            <h3>Overview</h3>
                            <table>
                              <tr>
                                <th>Total Files</th>
                                <td>${standardizedFiles.length}</td>
                              </tr>
                              <tr>
                                <th>File Types</th>
                                <td>${Array.from(new Set(standardizedFiles.map(file => file.extension.toUpperCase()))).join(', ')}</td>
                              </tr>
                              <tr>
                                <th>Total Size</th>
                                <td>${formatBytes(standardizedFiles.reduce((sum, file) => sum + file.size, 0))}</td>
                              </tr>
                            </table>
                          </div>
                          
                          <div class="file-section">
                            <h3>Files</h3>
                            <table>
                              <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Format</th>
                                <th>Size</th>
                              </tr>
                              ${standardizedFiles.map(file => `
                                <tr>
                                  <td>${file.name}</td>
                                  <td>${file.extension.toUpperCase()}</td>
                                  <td>${file.jsonData?.format || 'unknown'}</td>
                                  <td>${formatBytes(file.size)}</td>
                                </tr>
                              `).join('')}
                            </table>
                          </div>
                        </body>
                      </html>
                    `;
                    
                    const blob = new Blob([summaryContent], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-1 text-sm bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center"
                >
                  <FiGrid className="mr-1" /> View Summary
                </button>
                
                <button 
                  onClick={() => {
                    if (standardizedFiles.length > 0) {
                      const allData = {
                        exportDate: new Date().toISOString(),
                        files: standardizedFiles.map(file => file.jsonData)
                      };
                      const jsonContent = JSON.stringify(allData, null, 2);
                      const blob = new Blob([jsonContent], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'standardized-files.json';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-primary text-background rounded hover:opacity-90 transition-all flex items-center"
                >
                  <FiDownload className="mr-1" /> Export All
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FilesTab;