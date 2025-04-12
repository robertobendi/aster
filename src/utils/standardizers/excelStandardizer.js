/**
 * Excel Standardizer - Converts Excel (.xlsx/.xls) files to standardized JSON format
 */

/**
 * Standardize Excel file to JSON format
 * @param {ArrayBuffer} content - The Excel file content as ArrayBuffer
 * @param {Object} fileInfo - Information about the file
 * @returns {Object} Standardized JSON representation
 */
const standardizeExcel = (content, fileInfo) => {
    // Create base metadata
    const baseJson = createBaseMetadata(fileInfo);
    
    try {
      // Make sure SheetJS is loaded
      if (!window.XLSX) {
        throw new Error('SheetJS library not loaded. Cannot standardize Excel file.');
      }
      
      // Parse with SheetJS
      const workbook = window.XLSX.read(content, { 
        type: 'array',
        cellDates: true, 
        cellStyles: true,
        cellNF: true
      });
      
      // Get sheet names
      const sheetNames = workbook.SheetNames;
      
      // Process each sheet
      const sheets = {};
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Get sheet dimensions
        const range = window.XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        const dimensions = {
          startRow: range.s.r,
          endRow: range.e.r,
          startCol: range.s.c,
          endCol: range.e.c,
          totalRows: range.e.r - range.s.r + 1,
          totalCols: range.e.c - range.s.c + 1
        };
        
        // Convert to JSON with headers as keys
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, {
          defval: null,
          raw: false
        });
        
        // Get header row if available
        let headers = [];
        if (jsonData.length > 0) {
          headers = Object.keys(jsonData[0]);
        }
        
        // Also get the raw data with headers in first row
        const rawData = window.XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null,
          raw: false
        });
        
        // Get formulas if any
        const formulas = {};
        Object.keys(worksheet).forEach(cell => {
          if (cell[0] !== '!' && worksheet[cell].f) {
            formulas[cell] = worksheet[cell].f;
          }
        });
  
        // Store sheet data
        sheets[sheetName] = {
          data: jsonData,
          rawData: rawData,
          headers: headers,
          dimensions: dimensions,
          formulas: Object.keys(formulas).length > 0 ? formulas : null
        };
      });
      
      // Analyze data types for better integration with AI systems
      const dataAnalysis = analyzeExcelData(sheets);
      
      return {
        ...baseJson,
        format: 'excel',
        sheetNames: sheetNames,
        sheets: sheets,
        activeSheet: sheetNames[0],
        totalSheets: sheetNames.length,
        parseInfo: {
          parser: 'SheetJS',
          version: window.XLSX.version,
          success: true
        },
        dataAnalysis
      };
    } catch (error) {
      console.error('Error standardizing Excel file:', error);
      return {
        ...baseJson,
        error: `Failed to standardize Excel file: ${error.message}`,
        format: 'error'
      };
    }
  };
  
  /**
   * Analyze Excel data to determine column types and statistics
   * @param {Object} sheets - Processed sheets from the Excel file
   * @returns {Object} Analysis of the Excel data
   */
  const analyzeExcelData = (sheets) => {
    const analysis = {};
    
    Object.keys(sheets).forEach(sheetName => {
      const sheet = sheets[sheetName];
      const columnTypes = {};
      const columnStats = {};
      
      if (sheet.data.length > 0) {
        // Get column names from the first row
        const columns = sheet.headers;
        
        // Analyze each column
        columns.forEach(column => {
          const values = sheet.data.map(row => row[column]);
          const nonEmptyValues = values.filter(val => val !== null && val !== undefined && val !== '');
          
          // Determine column type
          let type = 'mixed';
          let numericCount = 0;
          let dateCount = 0;
          let booleanCount = 0;
          let stringCount = 0;
          
          nonEmptyValues.forEach(val => {
            if (typeof val === 'number' || !isNaN(Number(val))) {
              numericCount++;
            } else if (val instanceof Date || !isNaN(Date.parse(val))) {
              dateCount++;
            } else if (val === true || val === false || val === 'true' || val === 'false') {
              booleanCount++;
            } else {
              stringCount++;
            }
          });
          
          const total = nonEmptyValues.length;
          
          if (total === 0) {
            type = 'empty';
          } else if (numericCount / total > 0.75) {
            type = 'numeric';
          } else if (dateCount / total > 0.75) {
            type = 'date';
          } else if (booleanCount / total > 0.75) {
            type = 'boolean';
          } else if (stringCount / total > 0.75) {
            type = 'string';
          }
          
          // Basic statistics for numeric columns
          let stats = {};
          if (type === 'numeric') {
            const numbers = nonEmptyValues.map(v => Number(v)).filter(n => !isNaN(n));
            if (numbers.length > 0) {
              stats = {
                min: Math.min(...numbers),
                max: Math.max(...numbers),
                avg: numbers.reduce((sum, n) => sum + n, 0) / numbers.length,
                sum: numbers.reduce((sum, n) => sum + n, 0)
              };
            }
          }
          
          columnTypes[column] = {
            inferredType: type,
            nonEmptyCount: nonEmptyValues.length,
            totalCount: values.length,
            completeness: nonEmptyValues.length / values.length
          };
          
          if (Object.keys(stats).length > 0) {
            columnStats[column] = stats;
          }
        });
      }
      
      analysis[sheetName] = {
        columnTypes,
        columnStats,
        rowCount: sheet.data.length,
        totalCells: sheet.data.length * sheet.headers.length
      };
    });
    
    return analysis;
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
        standardizationId: `std-excel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }
    };
  };
  
  export default standardizeExcel;