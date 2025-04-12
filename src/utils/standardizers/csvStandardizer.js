/**
 * CSV Standardizer - Converts CSV files to standardized JSON format
 */

/**
 * Standardize CSV file to JSON format
 * @param {string} content - The raw CSV content
 * @param {Object} fileInfo - Information about the file
 * @returns {Object} Standardized JSON representation
 */
const standardizeCsv = (content, fileInfo) => {
    // Create base metadata
    const baseJson = createBaseMetadata(fileInfo);
    
    try {
      // Handle empty content case
      if (!content || content.trim() === '') {
        return {
          ...baseJson,
          data: [],
          format: 'tabular',
          structure: {
            headers: [],
            rowCount: 0,
            columnCount: 0
          }
        };
      }
      
      // Split content into lines and filter out empty lines
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // Handle empty file case
      if (lines.length === 0) {
        return {
          ...baseJson,
          data: [],
          format: 'tabular',
          structure: {
            headers: [],
            rowCount: 0,
            columnCount: 0
          }
        };
      }
      
      // Detect delimiter
      const delimiter = detectDelimiter(lines[0]);
      
      // Parse headers (first line)
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
      
      // Parse data rows
      const data = lines.slice(1).map((line, rowIndex) => {
        // Split by delimiter but respect quoted values
        const values = parseCSVLine(line, delimiter);
        
        // Create object with header keys
        const rowData = {};
        headers.forEach((header, index) => {
          // Get value or empty string if not present
          const value = index < values.length ? values[index] : '';
          rowData[header] = value;
        });
        
        // Add unique row ID
        rowData._rowId = `row-${rowIndex}`;
        
        return rowData;
      });
      
      // Analyze data types and generate statistics
      const analysis = analyzeCSVData(data, headers);
      
      return { 
        ...baseJson, 
        data, 
        format: 'tabular',
        structure: {
          headers,
          rowCount: data.length,
          columnCount: headers.length,
          delimiter
        },
        analysis
      };
    } catch (error) {
      console.error('Error standardizing CSV file:', error);
      return {
        ...baseJson,
        error: `Failed to standardize CSV file: ${error.message}`,
        format: 'error'
      };
    }
  };
  
  /**
   * Parse a CSV line respecting quoted values
   * @param {string} line - CSV line to parse
   * @param {string} delimiter - Delimiter used in the CSV
   * @returns {Array} Array of values from the line
   */
  const parseCSVLine = (line, delimiter) => {
    // If we have a simple line with no quotes, just split by delimiter
    if (!line.includes('"')) {
      return line.split(delimiter).map(v => v.trim());
    }
    
    // For lines with quotes, do more careful parsing
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // Handle quotes
      if (char === '"') {
        // If we see a double quote inside quotes, it's an escaped quote
        if (inQuotes && line[i+1] === '"') {
          currentValue += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      }
      // Handle delimiters
      else if (char === delimiter && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      }
      // Handle normal characters
      else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    return values;
  };
  
  /**
   * Detect the delimiter used in a CSV file
   * @param {string} firstLine - First line of the CSV file
   * @returns {string} Detected delimiter
   */
  const detectDelimiter = (firstLine) => {
    const possibleDelimiters = [',', ';', '\t', '|'];
    const counts = {};
    
    // If line has quoted sections, we need to ignore delimiters within quotes
    if (firstLine.includes('"')) {
      let inQuotes = false;
      
      for (let i = 0; i < firstLine.length; i++) {
        const char = firstLine[i];
        
        // Toggle quote state (and handle escaped quotes)
        if (char === '"') {
          if (inQuotes && firstLine[i+1] === '"') {
            i++; // Skip the next quote (it's escaped)
          } else {
            inQuotes = !inQuotes;
          }
        }
        // Count possible delimiters outside quotes
        else if (!inQuotes && possibleDelimiters.includes(char)) {
          counts[char] = (counts[char] || 0) + 1;
        }
      }
    } else {
      // Simple counting for unquoted lines
      for (const delimiter of possibleDelimiters) {
        counts[delimiter] = firstLine.split(delimiter).length - 1;
      }
    }
    
    // Find the delimiter with the highest count
    let maxCount = 0;
    let detectedDelimiter = ','; // Default
    
    for (const delimiter of possibleDelimiters) {
      if (counts[delimiter] > maxCount) {
        maxCount = counts[delimiter];
        detectedDelimiter = delimiter;
      }
    }
    
    return detectedDelimiter;
  };
  
  /**
   * Analyze CSV data to determine column types and statistics
   * @param {Array} data - Array of row objects
   * @param {Array} headers - Column headers
   * @returns {Object} Analysis of CSV data
   */
  const analyzeCSVData = (data, headers) => {
    // Initialize column analysis
    const columns = {};
    
    headers.forEach(header => {
      // Get all values for this column
      const values = data.map(row => row[header]);
      const nonEmptyValues = values.filter(val => val !== null && val !== undefined && val !== '');
      
      // Determine data type
      const typeAnalysis = inferColumnType(nonEmptyValues);
      
      // Generate statistics based on the type
      let statistics = {};
      
      if (typeAnalysis.inferredType === 'numeric') {
        const numbers = nonEmptyValues.map(v => parseFloat(v)).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          statistics = {
            min: Math.min(...numbers),
            max: Math.max(...numbers),
            avg: numbers.reduce((sum, n) => sum + n, 0) / numbers.length,
            sum: numbers.reduce((sum, n) => sum + n, 0)
          };
        }
      } else if (typeAnalysis.inferredType === 'string') {
        // Get frequency of values if not too many unique values
        const valueFrequency = {};
        nonEmptyValues.forEach(val => {
          valueFrequency[val] = (valueFrequency[val] || 0) + 1;
        });
        
        const uniqueValueCount = Object.keys(valueFrequency).length;
        
        statistics = {
          uniqueValueCount,
          // Only include frequency distribution if not too many unique values
          valueFrequency: uniqueValueCount <= 20 ? valueFrequency : null,
          minLength: nonEmptyValues.length > 0 ? Math.min(...nonEmptyValues.map(v => v.length)) : 0,
          maxLength: nonEmptyValues.length > 0 ? Math.max(...nonEmptyValues.map(v => v.length)) : 0,
        };
      }
      
      columns[header] = {
        ...typeAnalysis,
        statistics
      };
    });
    
    return {
      columns,
      totalRows: data.length,
      totalColumns: headers.length
    };
  };
  
  /**
   * Infer the data type of a column based on its values
   * @param {Array} values - Column values
   * @returns {Object} Type analysis
   */
  const inferColumnType = (values) => {
    if (values.length === 0) {
      return { inferredType: 'empty', confidence: 1 };
    }
    
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    
    // Regular expressions for type detection
    const numericRegex = /^-?\d+(\.\d+)?$/;
    const dateRegex = /^(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})$/;
    const booleanValues = ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'];
    
    values.forEach(val => {
      const valLower = (typeof val === 'string' ? val.toLowerCase() : String(val));
      
      if (numericRegex.test(valLower)) {
        numericCount++;
      }
      
      if (dateRegex.test(valLower) || !isNaN(Date.parse(valLower))) {
        dateCount++;
      }
      
      if (booleanValues.includes(valLower)) {
        booleanCount++;
      }
    });
    
    const total = values.length;
    
    // Determine the most likely type
    if (numericCount / total > 0.9) {
      return { 
        inferredType: 'numeric', 
        confidence: numericCount / total,
        patterns: { numeric: numericCount, total }
      };
    } else if (dateCount / total > 0.9) {
      return { 
        inferredType: 'date', 
        confidence: dateCount / total,
        patterns: { date: dateCount, total }
      };
    } else if (booleanCount / total > 0.9) {
      return { 
        inferredType: 'boolean', 
        confidence: booleanCount / total,
        patterns: { boolean: booleanCount, total }
      };
    } else {
      return { 
        inferredType: 'string', 
        confidence: 1,
        patterns: { 
          numeric: numericCount, 
          date: dateCount, 
          boolean: booleanCount, 
          total 
        }
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
        standardizationId: `std-csv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }
    };
  };
  
  export default standardizeCsv;