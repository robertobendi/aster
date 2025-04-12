import { useState, useEffect } from 'react';

/**
 * Hook for managing standardized files for AI context
 * Provides loading, storage, and selection functionality
 */
const useFileContext = () => {
  const [allFiles, setAllFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load files from storage on mount
  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      try {
        // Try to get files from localStorage
        const filesFromStorage = JSON.parse(localStorage.getItem('standardized_files')) || [];
        setAllFiles(filesFromStorage);
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFiles();
  }, []);
  
  /**
   * Add file to selection
   * @param {Object} file - File to add
   */
  const addFile = (file) => {
    if (!selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(prev => [...prev, file]);
    }
  };
  
  /**
   * Remove file from selection
   * @param {string} fileId - ID of file to remove
   */
  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };
  
  /**
   * Toggle file selection
   * @param {Object} file - File to toggle
   */
  const toggleFile = (file) => {
    if (selectedFiles.some(f => f.id === file.id)) {
      removeFile(file.id);
    } else {
      addFile(file);
    }
  };
  
  /**
   * Clear all selected files
   */
  const clearSelection = () => {
    setSelectedFiles([]);
  };
  
  /**
   * Select all available files
   */
  const selectAll = () => {
    setSelectedFiles([...allFiles]);
  };
  
  /**
   * Check if a file is selected
   * @param {string} fileId - File ID to check
   * @returns {boolean} - Whether file is selected
   */
  const isSelected = (fileId) => {
    return selectedFiles.some(file => file.id === fileId);
  };
  
  /**
   * Filter files by format
   * @param {string} format - Format to filter by
   * @returns {Array} - Filtered files
   */
  const filterByFormat = (format) => {
    if (!format) return allFiles;
    return allFiles.filter(file => file.jsonData?.format === format);
  };
  
  return {
    allFiles,
    selectedFiles,
    isLoading,
    addFile,
    removeFile,
    toggleFile,
    clearSelection,
    selectAll,
    isSelected,
    filterByFormat
  };
};

export default useFileContext;