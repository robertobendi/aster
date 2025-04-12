// Import all standardizers
import standardizeExcel from './excelStandardizer';
import standardizeMarkdown from './markdownStandardizer';
import standardizeCsv from './csvStandardizer';
import standardizeJson from './jsonStandardizer';

// Function to select the appropriate standardizer based on file extension
export const standardizeFile = (content, fileInfo) => {
  const { extension } = fileInfo;
  
  // Select standardizer based on file extension
  switch (extension.toLowerCase()) {
    case 'xlsx':
    case 'xls':
      return standardizeExcel(content, fileInfo);
    case 'md':
      return standardizeMarkdown(content, fileInfo);
    case 'csv':
      return standardizeCsv(content, fileInfo);
    case 'json':
      return standardizeJson(content, fileInfo);
    default:
      // Return error for unsupported file types
      return {
        metadata: {
          filename: fileInfo.name,
          fileType: fileInfo.type,
          fileSize: fileInfo.size,
          extension: fileInfo.extension,
          uploadDate: fileInfo.uploadDate.toISOString(),
          conversionDate: new Date().toISOString()
        },
        error: `Unsupported file type: ${fileInfo.extension}`,
        format: 'error'
      };
  }
};

// Export individual standardizers for direct use if needed
export {
  standardizeExcel,
  standardizeMarkdown,
  standardizeCsv,
  standardizeJson
};

// Default export the main standardization function
export default standardizeFile;