// csvStandardizer.js
import { createBaseMetadata } from './utils';

/**
 * Standardize CSV to JSON format
 * @param {string} content - The CSV file content
 * @param {Object} fileInfo - File metadata
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Object} Standardized JSON with CSV data
 */
const standardizeCsv = async (content, fileInfo, progressCallback = () => {}) => {
  progressCallback(10);
  
  try {
    // Create base metadata object
    const baseJson = createBaseMetadata(fileInfo);
    progressCallback(20);
    
    // Use PapaParse for robust CSV parsing if available
    try {
      // Dynamic import for PapaParse
      const Papa = await import('papaparse');
      
      // Parse CSV with PapaParse's config for best results
      const parseResult = Papa.default.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        trimHeaders: true,
      });
      
      progressCallback(50);
      
      // Analyze the parsed data
      const headers = parseResult.meta.fields || [];
      const data = parseResult.data || [];
      
      // Calculate column statistics
      const columnStats = {};
      
      headers.forEach(header => {
        const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined);
        
        // Determine column type
        const types = values.reduce((acc, val) => {
          const type = typeof val;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        // Get the most common type
        const mostCommonType = Object.entries(types)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0])[0] || 'unknown';
        
        // Calculate numeric stats if applicable
        let numericStats = {};
        if (mostCommonType === 'number') {
          const numericValues = values.filter(v => typeof v === 'number');
          if (numericValues.length > 0) {
            const sum = numericValues.reduce((acc, val) => acc + val, 0);
            numericStats = {
              min: Math.min(...numericValues),
              max: Math.max(...numericValues),
              avg: sum / numericValues.length,
              sum: sum
            };
          }
        }
        
        columnStats[header] = {
          type: mostCommonType,
          nonEmptyCount: values.length,
          uniqueValues: new Set(values).size,
          ...numericStats
        };
      });
      
      progressCallback(80);
      
      return {
        ...baseJson,
        format: 'csv',
        data: data,
        headers: headers,
        analysis: {
          rowCount: data.length,
          columnCount: headers.length,
          columns: columnStats,
          parseInfo: {
            errors: parseResult.errors,
            delimiter: parseResult.meta.delimiter
          }
        }
      };
    } catch (error) {
      // Fallback to basic parsing if PapaParse fails or isn't available
      progressCallback(30);
      
      // Basic CSV parsing
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',');
        const row = {};
        
        headers.forEach((header, index) => {
          let value = values[index] ? values[index].trim() : '';
          
          // Try to convert numeric values
          if (value !== '' && !isNaN(value)) {
            value = Number(value);
          }
          
          row[header] = value;
        });
        
        data.push(row);
      }
      
      progressCallback(70);
      
      return {
        ...baseJson,
        format: 'csv',
        data: data,
        headers: headers,
        analysis: {
          rowCount: data.length,
          columnCount: headers.length
        },
        parseInfo: {
          method: 'basic',
          papaParseError: error.message
        }
      };
    }
  } catch (error) {
    console.error('CSV standardization error:', error);
    return {
      ...createBaseMetadata(fileInfo),
      format: 'error',
      error: error.message
    };
  }
};

export default standardizeCsv;