// standardizers/index.js
import standardizeExcel from './excelStandardizer';
import standardizeMarkdown from './markdownStandardizer';
import standardizeCsv from './csvStandardizer';
import standardizeJson from './jsonStandardizer';
import { createBaseMetadata } from './utils';

export {
  standardizeExcel,
  standardizeMarkdown,
  standardizeCsv,
  standardizeJson,
  createBaseMetadata
};

// Default export for convenience
export default {
  excel: standardizeExcel,
  markdown: standardizeMarkdown,
  csv: standardizeCsv,
  json: standardizeJson,
  createBaseMetadata
};