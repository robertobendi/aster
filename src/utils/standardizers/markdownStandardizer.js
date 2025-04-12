// markdownStandardizer.js
import { createBaseMetadata } from './utils';

/**
 * Standardize Markdown to JSON format
 * @param {string} content - The Markdown file content
 * @param {Object} fileInfo - File metadata
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Object} Standardized JSON
 */
const standardizeMarkdown = async (content, fileInfo, progressCallback = () => {}) => {
  progressCallback(10);
  
  try {
    // Create base metadata object
    const baseJson = createBaseMetadata(fileInfo);
    progressCallback(30);
    
    // Parse markdown content
    // Split content into sections based on headers
    const lines = content.split('\n');
    const sections = [];
    let currentSection = { title: 'Introduction', content: '' };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line is a header
      if (line.startsWith('#')) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          sections.push(currentSection);
        }
        
        // Extract header level and text
        const match = line.match(/^(#+)\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const title = match[2].trim();
          currentSection = { 
            title, 
            level, 
            content: '' 
          };
        }
      } else {
        // Add line to current section content
        currentSection.content += line + '\n';
      }
    }
    
    // Add the last section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }
    
    progressCallback(70);
    
    // Create analysis of the markdown
    const analysis = {
      totalSections: sections.length,
      totalLength: content.length,
      averageSectionLength: sections.length > 0 ? Math.round(content.length / sections.length) : 0,
      headerLevels: sections.reduce((acc, section) => {
        if (section.level) {
          acc[section.level] = (acc[section.level] || 0) + 1;
        }
        return acc;
      }, {})
    };
    
    progressCallback(90);
    
    return {
      ...baseJson,
      format: 'markdown',
      content: content,
      sections: sections,
      analysis: analysis
    };
  } catch (error) {
    console.error('Markdown standardization error:', error);
    return {
      ...createBaseMetadata(fileInfo),
      format: 'error',
      error: error.message
    };
  }
};

export default standardizeMarkdown;