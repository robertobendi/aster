// jsonStandardizer.js
import { createBaseMetadata } from './utils';

/**
 * Standardize JSON to internal JSON format
 * @param {string} content - The JSON file content as string
 * @param {Object} fileInfo - File metadata
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Object} Standardized JSON with metadata
 */
const standardizeJson = async (content, fileInfo, progressCallback = () => {}) => {
  progressCallback(10);
  
  try {
    // Create base metadata object
    const baseJson = createBaseMetadata(fileInfo);
    progressCallback(30);
    
    // Parse JSON content
    const parsedJson = JSON.parse(content);
    progressCallback(60);
    
    // Analyze the structure
    const analysis = analyzeJsonStructure(parsedJson);
    progressCallback(90);
    
    return {
      ...baseJson,
      format: 'json',
      data: parsedJson,
      analysis: analysis
    };
  } catch (error) {
    console.error('JSON standardization error:', error);
    return {
      ...createBaseMetadata(fileInfo),
      format: 'error',
      error: error.message
    };
  }
};

// Helper function to analyze JSON structure
const analyzeJsonStructure = (json) => {
  const analysis = {
    type: typeof json,
    isArray: Array.isArray(json),
    depth: 0,
    fields: {}
  };
  
  if (analysis.isArray) {
    analysis.length = json.length;
    
    // Sample the first few items if array is not empty
    if (json.length > 0) {
      analysis.sampleItem = json[0];
      analysis.itemType = typeof json[0];
      
      // If array contains objects, analyze the fields in first item
      if (analysis.itemType === 'object' && json[0] !== null) {
        analysis.fields = Object.keys(json[0]).reduce((acc, key) => {
          acc[key] = typeof json[0][key];
          return acc;
        }, {});
      }
    }
  } else if (typeof json === 'object' && json !== null) {
    // For objects, collect all top-level keys and their types
    analysis.fields = Object.keys(json).reduce((acc, key) => {
      acc[key] = typeof json[key];
      return acc;
    }, {});
    analysis.totalFields = Object.keys(json).length;
  }
  
  return analysis;
};

export default standardizeJson;