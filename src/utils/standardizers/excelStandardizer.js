// excelStandardizer.js
import { createBaseMetadata } from './utils';

/**
 * Standardize Excel file to JSON format
 * @param {ArrayBuffer} content - The Excel file content as ArrayBuffer
 * @param {Object} fileInfo - File metadata
 * @param {Function} progressCallback - Optional callback to track progress %
 * @returns {Object} Standardized JSON object
 */
const standardizeExcel = async (content, fileInfo, progressCallback = () => {}) => {
  progressCallback(10);
  const baseJson = createBaseMetadata(fileInfo);
  
  if (!window.XLSX) {
    throw new Error("SheetJS library not found in window scope");
  }
  
  try {
    // Use SheetJS to parse Excel file
    const workbook = window.XLSX.read(content, {
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellStyles: false
    });
    
    progressCallback(40);
    
    const sheetNames = workbook.SheetNames;
    const sheets = {};
    
    // Process each sheet
    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet || !worksheet['!ref']) {
        sheets[sheetName] = {
          error: 'Empty or malformed sheet.',
          data: [],
          headers: [],
        };
        continue;
      }
      
      // Convert to JSON
      const data = window.XLSX.utils.sheet_to_json(worksheet, { 
        defval: null,
        raw: false
      });
      
      // Extract headers
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      
      // Extract dimensions
      const range = window.XLSX.utils.decode_range(worksheet['!ref']);
      const dimensions = {
        totalRows: range.e.r - range.s.r + 1,
        totalCols: range.e.c - range.s.c + 1
      };
      
      sheets[sheetName] = {
        data,
        headers,
        dimensions
      };
      
      progressCallback(50 + (40 * (i + 1)) / sheetNames.length);
    }
    
    // Create column statistics for the first sheet
    const firstSheetName = sheetNames[0];
    if (sheets[firstSheetName] && sheets[firstSheetName].data.length > 0) {
      const firstSheet = sheets[firstSheetName];
      const columnStats = {};
      
      firstSheet.headers.forEach(header => {
        const values = firstSheet.data.map(row => row[header]);
        const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
        
        // Determine column type
        const typeCounts = {
          numeric: 0,
          string: 0,
          date: 0,
          boolean: 0,
        };
        
        nonEmpty.forEach(val => {
          if (typeof val === 'number') typeCounts.numeric++;
          else if (typeof val === 'boolean') typeCounts.boolean++;
          else if (typeof val === 'string' && !isNaN(Date.parse(val))) typeCounts.date++;
          else typeCounts.string++;
        });
        
        const maxType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
        
        columnStats[header] = {
          inferredType: maxType,
          nonEmptyCount: nonEmpty.length,
          completeness: nonEmpty.length / values.length,
        };
        
        if (maxType === 'numeric') {
          const nums = nonEmpty.map(n => Number(n)).filter(n => !isNaN(n));
          if (nums.length > 0) {
            const sum = nums.reduce((a, b) => a + b, 0);
            columnStats[header].stats = {
              min: Math.min(...nums),
              max: Math.max(...nums),
              sum,
              avg: sum / nums.length
            };
          }
        }
      });
      
      sheets[firstSheetName].columnStats = columnStats;
    }
    
    progressCallback(95);
    
    return {
      ...baseJson,
      format: 'excel',
      sheets,
      sheetNames,
      totalSheets: sheetNames.length,
      parseInfo: {
        parser: 'SheetJS',
        version: window.XLSX.version,
        success: true
      }
    };
  } catch (error) {
    console.error('Excel parse error:', error);
    return {
      ...baseJson,
      format: 'error',
      error: error.message,
    };
  }
};

export default standardizeExcel;