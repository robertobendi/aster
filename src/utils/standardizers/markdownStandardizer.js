/**
 * Markdown Standardizer - Converts Markdown (.md) files to standardized JSON format
 */

/**
 * Standardize Markdown file to JSON format
 * @param {string} content - The raw Markdown content
 * @param {Object} fileInfo - Information about the file
 * @returns {Object} Standardized JSON representation
 */
const standardizeMarkdown = (content, fileInfo) => {
    // Create base metadata
    const baseJson = createBaseMetadata(fileInfo);
    
    try {
      // Split content into lines
      const mdLines = content.split('\n');
      
      // Extract document structure
      const structure = extractDocumentStructure(mdLines);
      
      // Extract links
      const links = extractLinks(content);
      
      // Extract code blocks
      const codeBlocks = extractCodeBlocks(mdLines);
      
      // Find images
      const images = extractImages(content);
      
      // Process lists
      const lists = extractLists(mdLines);
      
      // Create final JSON structure
      return {
        ...baseJson,
        data: {
          fullText: content,
          sections: structure.sections,
          structure: {
            headings: structure.headings,
            links: links,
            images: images,
            codeBlocks: codeBlocks,
            lists: lists
          }
        },
        format: 'markdown',
        statistics: {
          totalCharacters: content.length,
          totalWords: content.split(/\s+/).filter(Boolean).length,
          totalLines: mdLines.length,
          headingCount: structure.headings.length,
          linkCount: links.length,
          imageCount: images.length,
          codeBlockCount: codeBlocks.length,
          listCount: Object.keys(lists).length
        }
      };
    } catch (error) {
      console.error('Error standardizing Markdown file:', error);
      return {
        ...baseJson,
        error: `Failed to standardize Markdown file: ${error.message}`,
        format: 'error'
      };
    }
  };
  
  /**
   * Extract the document structure (sections and headings)
   * @param {string[]} lines - Lines of the markdown document
   * @returns {Object} Document structure with sections and headings
   */
  const extractDocumentStructure = (lines) => {
    let currentHeading = 'Introduction';
    let currentLevel = 0;
    const sections = [];
    const headings = [];
    let currentContent = [];
    
    // Process each line
    lines.forEach((line, index) => {
      // Check if line is heading
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        // If we already have content, save the previous section
        if (currentContent.length > 0) {
          sections.push({
            id: `section-${sections.length}`,
            title: currentHeading,
            level: currentLevel,
            content: currentContent.join('\n')
          });
          currentContent = [];
        }
        
        currentLevel = headingMatch[1].length;
        currentHeading = headingMatch[2].trim();
        
        // Add to headings list
        headings.push({
          title: currentHeading,
          level: currentLevel,
          index: index
        });
      } else {
        currentContent.push(line);
      }
    });
    
    // Add the last section
    if (currentContent.length > 0) {
      sections.push({
        id: `section-${sections.length}`,
        title: currentHeading,
        level: currentLevel,
        content: currentContent.join('\n')
      });
    }
    
    return { sections, headings };
  };
  
  /**
   * Extract links from markdown content
   * @param {string} content - Markdown content
   * @returns {Array} List of links
   */
  const extractLinks = (content) => {
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;
    
    while ((match = linkPattern.exec(content)) !== null) {
      links.push({
        text: match[1],
        url: match[2],
        position: match.index
      });
    }
    
    return links;
  };
  
  /**
   * Extract code blocks from markdown
   * @param {string[]} lines - Lines of the markdown document
   * @returns {Array} List of code blocks
   */
  const extractCodeBlocks = (lines) => {
    const codeBlocks = [];
    let inCodeBlock = false;
    let currentCodeBlock = {
      language: '',
      code: [],
      startLine: 0
    };
    
    lines.forEach((line, index) => {
      // Check for code block markers ```
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          codeBlocks.push({
            ...currentCodeBlock,
            endLine: index
          });
          inCodeBlock = false;
        } else {
          // Start of code block
          inCodeBlock = true;
          const language = line.trim().replace('```', '').trim();
          currentCodeBlock = {
            language: language,
            code: [],
            startLine: index
          };
        }
      } else if (inCodeBlock) {
        // Inside code block
        currentCodeBlock.code.push(line);
      }
    });
    
    // If document ends with an unclosed code block, add it
    if (inCodeBlock) {
      codeBlocks.push({
        ...currentCodeBlock,
        endLine: lines.length - 1
      });
    }
    
    // Join code blocks and format output
    return codeBlocks.map(block => ({
      language: block.language,
      code: block.code.join('\n'),
      startLine: block.startLine,
      endLine: block.endLine,
      lineCount: block.endLine - block.startLine - 1
    }));
  };
  
  /**
   * Extract images from markdown content
   * @param {string} content - Markdown content
   * @returns {Array} List of images
   */
  const extractImages = (content) => {
    const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;
    
    while ((match = imagePattern.exec(content)) !== null) {
      images.push({
        alt: match[1],
        url: match[2],
        position: match.index
      });
    }
    
    return images;
  };
  
  /**
   * Extract lists from markdown content
   * @param {string[]} lines - Lines of the markdown document
   * @returns {Object} Object containing ordered and unordered lists
   */
  const extractLists = (lines) => {
    const lists = {
      ordered: [],
      unordered: []
    };
    
    let currentList = null;
    
    lines.forEach((line, index) => {
      // Check for ordered list item
      const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (orderedMatch) {
        const indent = orderedMatch[1].length;
        const content = orderedMatch[2];
        
        if (!currentList || currentList.type !== 'ordered') {
          // Start new ordered list
          if (currentList) {
            // Save previous list if it exists
            lists[currentList.type].push(currentList);
          }
          
          currentList = {
            type: 'ordered',
            items: [],
            startLine: index,
            indent: indent
          };
        }
        
        currentList.items.push({
          content: content,
          lineIndex: index,
          indent: indent
        });
      } 
      // Check for unordered list item
      else if (line.match(/^(\s*)[\*\-\+]\s+(.+)$/)) {
        const match = line.match(/^(\s*)[\*\-\+]\s+(.+)$/);
        const indent = match[1].length;
        const content = match[2];
        
        if (!currentList || currentList.type !== 'unordered') {
          // Start new unordered list
          if (currentList) {
            // Save previous list if it exists
            lists[currentList.type].push(currentList);
          }
          
          currentList = {
            type: 'unordered',
            items: [],
            startLine: index,
            indent: indent
          };
        }
        
        currentList.items.push({
          content: content,
          lineIndex: index,
          indent: indent
        });
      } 
      // Empty line or non-list line ends the current list
      else if (currentList && (line.trim() === '' || !line.match(/^\s*[\*\-\+\d]\s+/))) {
        lists[currentList.type].push({
          ...currentList,
          endLine: index - 1
        });
        currentList = null;
      }
    });
    
    // Add the last list if there is one
    if (currentList) {
      lists[currentList.type].push({
        ...currentList,
        endLine: lines.length - 1
      });
    }
    
    return lists;
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
        standardizationId: `std-md-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      }
    };
  };
  
  export default standardizeMarkdown;