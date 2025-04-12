/**
 * JSON Standardizer - Validates and enhances JSON files
 */

/**
 * Standardize JSON file by validating and enhancing with metadata
 * @param {string} content - The raw JSON content as string
 * @param {Object} fileInfo - Information about the file
 * @returns {Object} Validated and enhanced JSON
 */
const standardizeJson = (content, fileInfo) => {
    // Create base metadata
    const baseJson = createBaseMetadata(fileInfo);
    
    try {
      // Parse the JSON to validate it and to get a proper object
      const parsedJson = JSON.parse(content);
      
      // Analyze JSON structure
      const structure = analyzeJsonStructure(parsedJson);
      
      return {
        ...baseJson,
        data: parsedJson,
        format: 'json',
        structure
      };
    } catch (error) {
      console.error('Error standardizing JSON file:', error);
      return {
        ...baseJson,
        error: `Invalid JSON: ${error.message}`,
        format: 'error'
      };
    }
  };
  
  /**
   * Analyze the structure of a JSON object
   * @param {Object|Array} json - The JSON object or array to analyze
   * @returns {Object} Structure analysis
   */
  const analyzeJsonStructure = (json) => {
    // If it's an array
    if (Array.isArray(json)) {
      return {
        type: 'array',
        length: json.length,
        sampleItemTypes: json.length > 0 ? 
          typeof json[0] === 'object' ? 
            Object.keys(json[0]).reduce((acc, key) => {
              acc[key] = typeof json[0][key];
              return acc;
            }, {}) : 
            typeof json[0] : 
          null
      };
    } 
    // If it's an object
    else if (typeof json === 'object' && json !== null) {
      return {
        type: 'object',
        keys: Object.keys(json),
        keyCount: Object.keys(json).length,
        valueTypes: Object.keys(json).reduce((acc, key) => {
          acc[key] = typeof json[key];
          return acc;
        }, {})
      };
    } 
    // If it's a primitive value
    else {
      return {
        type: typeof json,
        primitive: true
      };
    }
  };
  
  /**
   * Create base metadata for the standardized file
   * @param {Object} fileInfo - Information about the file 
   * @returns {Object} Base metadata object
   */
  const createBaseMetadata = (fileInfo) => {
    const { name, type, size, extension, uploadDate } = fileInfo;
    
    return {
      metadata: {
        filename: name,
        fileType: type,
        fileSize: size,
        extension,
        uploadDate: uploadDate.toISOString(),
        conversionDate: new Date().toISOString(),
        standardizationId: `std-json-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }
    };
  };
  
  export default standardizeJson;