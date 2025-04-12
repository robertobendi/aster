// utils.js - Common utility functions for standardizers

/**
 * Create base metadata object from file info
 * @param {Object} fileInfo - File metadata object
 * @returns {Object} Base JSON object with metadata
 */
export const createBaseMetadata = (fileInfo) => {
    const { name, type, size, extension, uploadDate } = fileInfo;
    return {
      metadata: {
        filename: name,
        fileType: type,
        fileSize: size,
        extension,
        uploadDate: uploadDate?.toISOString?.() || new Date().toISOString(),
        conversionDate: new Date().toISOString(),
        standardizationId: `std-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      }
    };
  };