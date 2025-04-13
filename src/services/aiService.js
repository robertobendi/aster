import simpleStorage from '../utils/simpleStorage';

/**
 * Intelligently samples content from large files to fit within context limits
 * @param {object} file - File object with metadata and content
 * @param {number} maxSize - Target maximum size in bytes
 * @returns {string} - Sampled file content
 */
const getOptimizedFileContent = (file, maxSize = 50000) => {
  let fileContent = '';
  
  try {
    if (!file.jsonData) {
      return "File has no data content";
    }
    
    const fileSize = file.size || 0;
    // Adjust sampling based on file size
    const sizeFactor = fileSize > 1000000 ? 0.01 : fileSize > 500000 ? 0.05 : fileSize > 100000 ? 0.2 : 0.5;
    
    if (file.extension === 'md' && file.jsonData.content) {
      const content = file.jsonData.content;
      // For very large markdown, sample sections intelligently
      if (content.length > maxSize) {
        // Extract introduction (first 20% or 2000 chars)
        const intro = content.substring(0, Math.min(content.length * 0.2, 2000));
        
        // Find section headers
        const headerMatches = [...content.matchAll(/#{1,6}\s+(.+?)(?=\n)/g)];
        const headerInfo = headerMatches.map(match => ({ 
          title: match[1].trim(),
          position: match.index 
        }));
        
        // Sample sections from different parts of the document
        let sampledSections = '';
        if (headerInfo.length > 0) {
          // Get evenly distributed section samples (up to 5 sections)
          const sectionCount = Math.min(5, headerInfo.length);
          const step = Math.floor(headerInfo.length / sectionCount);
          
          for (let i = 0; i < headerInfo.length; i += step) {
            const header = headerInfo[i];
            // Find next header to determine section length
            const nextHeaderPos = headerInfo[i+1]?.position || content.length;
            // Extract a sample from each section (up to 1000 chars per section)
            const sectionLength = Math.min(1000, nextHeaderPos - header.position);
            const sectionSample = content.substring(header.position, header.position + sectionLength);
            sampledSections += sectionSample + "\n...\n";
          }
        } else {
          // For documents without clear sections, sample parts
          const chunks = 3;
          const chunkSize = Math.floor(content.length / chunks);
          for (let i = 0; i < chunks; i++) {
            const start = i * chunkSize;
            sampledSections += content.substring(start, start + Math.min(1000, chunkSize)) + "\n...\n";
          }
        }
        
        // Get conclusion (last 10% or 1000 chars)
        const conclusion = content.substring(content.length - Math.min(content.length * 0.1, 1000));
        
        fileContent = `${intro}\n\n...\n[Content sampled due to size]\n...\n\n${sampledSections}\n...\n\n${conclusion}`;
      } else {
        fileContent = content;
      }
    } 
    else if (file.extension === 'csv' && file.jsonData.data) {
      const data = file.jsonData.data;
      // For CSV, show headers and sample rows from beginning, middle, and end
      fileContent = `Headers: ${file.jsonData.headers?.join(', ') || 'None'}\n`;
      
      if (data.length > 0) {
        fileContent += `Total rows: ${data.length}\n\n`;
        
        // Sample beginning (up to 10 rows)
        const beginSample = Math.min(10, data.length);
        fileContent += `Beginning sample (${beginSample} rows):\n`;
        for (let i = 0; i < beginSample; i++) {
          fileContent += JSON.stringify(data[i]) + '\n';
        }
        
        // If data is large, add middle and end samples
        if (data.length > 30) {
          // Middle sample (up to 5 rows)
          const midStart = Math.floor(data.length / 2) - 2;
          fileContent += `\nMiddle sample (rows ${midStart}-${midStart + 4}):\n`;
          for (let i = 0; i < 5 && midStart + i < data.length; i++) {
            fileContent += JSON.stringify(data[midStart + i]) + '\n';
          }
          
          // End sample (up to 5 rows)
          const endStart = Math.max(midStart + 5, data.length - 5);
          fileContent += `\nEnd sample (last ${data.length - endStart} rows):\n`;
          for (let i = endStart; i < data.length; i++) {
            fileContent += JSON.stringify(data[i]) + '\n';
          }
        }
      }
    } 
    else if (file.extension === 'xlsx' && file.jsonData.sheets) {
      const sheetNames = file.jsonData.sheetNames || [];
      fileContent = `Excel file with ${sheetNames.length} sheets: ${sheetNames.join(', ')}\n\n`;
      
      // Calculate sheets to sample based on total count
      const sheetSampleSize = Math.min(3, sheetNames.length);
      const sheetSamples = [];
      
      // First sheet is usually most important
      if (sheetNames.length > 0) {
        sheetSamples.push(sheetNames[0]);
      }
      
      // Add additional sheets if available
      if (sheetNames.length > 1) {
        // Prefer specific named sheets that might be important
        const importantKeywords = ['summary', 'data', 'main', 'overview', 'total'];
        const importantSheets = sheetNames.filter(name => 
          importantKeywords.some(keyword => 
            name.toLowerCase().includes(keyword)
          )
        );
        
        // Add up to 2 important sheets
        for (let i = 0; i < Math.min(2, importantSheets.length); i++) {
          if (!sheetSamples.includes(importantSheets[i])) {
            sheetSamples.push(importantSheets[i]);
          }
        }
        
        // If we still need more sheets, add middle and/or last
        if (sheetSamples.length < sheetSampleSize) {
          if (sheetNames.length > 2 && !sheetSamples.includes(sheetNames[Math.floor(sheetNames.length/2)])) {
            sheetSamples.push(sheetNames[Math.floor(sheetNames.length/2)]);
          }
          
          if (sheetSamples.length < sheetSampleSize && 
              sheetNames.length > 1 && 
              !sheetSamples.includes(sheetNames[sheetNames.length-1])) {
            sheetSamples.push(sheetNames[sheetNames.length-1]);
          }
        }
      }
      
      // Process each sampled sheet
      for (const sheetName of sheetSamples) {
        const sheet = file.jsonData.sheets[sheetName];
        if (sheet && sheet.data) {
          fileContent += `=== SHEET: ${sheetName} ===\n`;
          const data = sheet.data;
          
          if (data.length > 0) {
            // Show headers
            fileContent += `Headers: ${Object.keys(data[0]).join(', ')}\n`;
            fileContent += `Total rows: ${data.length}\n`;
            
            // Sample rows - beginning, middle, end approach
            const rowsToSample = Math.min(20, data.length);
            const beginSample = Math.min(10, rowsToSample);
            
            // Beginning rows
            fileContent += `Sample (first ${beginSample} rows):\n`;
            for (let i = 0; i < beginSample; i++) {
              fileContent += JSON.stringify(data[i]) + '\n';
            }
            
            // If more rows available, sample middle and end
            if (data.length > 20) {
              const midPoint = Math.floor(data.length / 2);
              fileContent += `Sample (middle rows ${midPoint}-${midPoint+4}):\n`;
              for (let i = 0; i < 5 && midPoint + i < data.length; i++) {
                fileContent += JSON.stringify(data[midPoint + i]) + '\n';
              }
              
              // Last few rows
              if (data.length > beginSample + 5) {
                const endStart = Math.max(0, data.length - 5);
                fileContent += `Sample (last 5 rows):\n`;
                for (let i = endStart; i < data.length; i++) {
                  fileContent += JSON.stringify(data[i]) + '\n';
                }
              }
            }
          } else {
            fileContent += "Empty sheet\n";
          }
          fileContent += '\n';
        }
      }
      
      if (sheetNames.length > sheetSamples.length) {
        fileContent += `[${sheetNames.length - sheetSamples.length} additional sheets not shown]\n`;
      }
    } 
    else if (file.extension === 'json') {
      try {
        const jsonData = file.jsonData.data;
        
        // Handle different JSON structures
        if (Array.isArray(jsonData)) {
          fileContent = `JSON array with ${jsonData.length} items.\n`;
          
          if (jsonData.length > 0) {
            // For large arrays, sample from beginning, middle, end
            const sampleSize = Math.min(5, jsonData.length);
            
            // Beginning items
            fileContent += `Beginning items (${sampleSize}):\n`;
            const beginSample = jsonData.slice(0, sampleSize);
            fileContent += JSON.stringify(beginSample, null, 2) + '\n';
            
            // If array is large, add middle and end samples
            if (jsonData.length > 15) {
              // Middle items
              const midStart = Math.floor(jsonData.length / 2) - 1;
              fileContent += `Middle items (${midStart}-${midStart+2}):\n`;
              const midSample = jsonData.slice(midStart, midStart + 3);
              fileContent += JSON.stringify(midSample, null, 2) + '\n';
              
              // End items
              const endStart = Math.max(midStart + 3, jsonData.length - 3);
              fileContent += `End items (${endStart}-${jsonData.length-1}):\n`;
              const endSample = jsonData.slice(endStart);
              fileContent += JSON.stringify(endSample, null, 2) + '\n';
            }
          }
        } 
        else if (typeof jsonData === 'object' && jsonData !== null) {
          // For objects, show structure and key samples
          const keys = Object.keys(jsonData);
          fileContent = `JSON object with ${keys.length} keys: ${keys.join(', ')}\n\n`;
          
          if (keys.length > 0) {
            // Sample key-value pairs based on object size
            const sampleSize = Math.min(keys.length, 10);
            const sampledKeys = keys.slice(0, sampleSize);
            
            fileContent += `Sample of content:\n`;
            const sample = {};
            sampledKeys.forEach(key => {
              sample[key] = jsonData[key];
            });
            
            fileContent += JSON.stringify(sample, null, 2);
            
            if (keys.length > sampleSize) {
              fileContent += `\n\n[${keys.length - sampleSize} more keys not shown]\n`;
            }
          }
        } 
        else {
          // Primitive value
          fileContent = `JSON value: ${JSON.stringify(jsonData)}`;
        }
      } catch (e) {
        fileContent = `Error processing JSON: ${e.message}`;
      }
    } 
    else {
      fileContent = "File format not fully supported for detailed content extraction";
    }
  } catch (err) {
    console.error(`Error extracting content from ${file?.name || 'unknown file'}:`, err);
    fileContent = `Error extracting content: ${err.message}`;
  }
  
  // Final size check and truncation if needed
  if (fileContent.length > maxSize) {
    const halfSize = Math.floor(maxSize / 2);
    fileContent = fileContent.substring(0, halfSize) + 
                 "\n\n... [content truncated due to size] ...\n\n" + 
                 fileContent.substring(fileContent.length - halfSize);
  }
  
  return fileContent;
};

/**
 * Prepares the prompt with file contexts with intelligent handling of large files
 */
const preparePromptWithContext = (prompt, selectedFiles = [], defaultContext = '') => {
  console.log("Preparing prompt with", selectedFiles.length, "files");
  
  // Track size for debugging and optimization
  let totalPromptSize = 0;
  let totalFileSize = selectedFiles.reduce((sum, f) => sum + (f.size || 0), 0);
  
  // Determine max size per file based on total selected files and prompt size
  // This helps balance context allocation between many small files or few large files
  const baseMaxPerFile = 100000; // ~100KB base max
  const promptLength = prompt.length;
  const fileCount = selectedFiles.length;
  
  // Adjust max size based on number of files and prompt length
  let maxPerFile = fileCount <= 1 ? baseMaxPerFile : 
                  fileCount <= 3 ? Math.floor(baseMaxPerFile / 2) : 
                  fileCount <= 5 ? Math.floor(baseMaxPerFile / 3) :
                  Math.floor(baseMaxPerFile / 4);
                  
  // Further reduce for very large prompts
  if (promptLength > 5000) {
    maxPerFile = Math.floor(maxPerFile * 0.8);
  }
  
  console.log(`Total file size: ${Math.round(totalFileSize/1024)}KB, Max per file: ${Math.round(maxPerFile/1024)}KB`);
  
  let fullPrompt = prompt;
  let systemMessage = 'You are ASTER, an AI assistant for data analysis and document understanding.';
  
  // Add default context if available
  if (defaultContext && defaultContext.trim()) {
    systemMessage += `\n\nAdditional context: ${defaultContext}`;
  }
  
  // Process files based on type priority (prioritize more structured data)
  // This helps ensure most important files get more context space
  let sortedFiles = [...selectedFiles].sort((a, b) => {
    // Priority order: xlsx > json > csv > md > others
    const typePriority = {
      'xlsx': 1,
      'json': 2,
      'csv': 3,
      'md': 4
    };
    
    const aPriority = typePriority[a.extension] || 99;
    const bPriority = typePriority[b.extension] || 99;
    return aPriority - bPriority;
  });
  
  // Add file content as context
  if (sortedFiles.length > 0) {
    // Map all files to their context strings with optimized content extraction
    const fileContexts = sortedFiles.map(file => {
      console.log(`Processing file: ${file.name} (${file.extension}) with size ${Math.round(file.size/1024)} KB`);
      
      // Get optimized content based on file size and importance
      const fileContent = getOptimizedFileContent(file, maxPerFile);
      
      const fileContext = `--- FILE: ${file.name} ---\n${fileContent}\n`;
      totalPromptSize += fileContext.length;
      return fileContext;
    });
    
    // Join all file contexts
    const filesContext = fileContexts.join('\n');
    
    // Construct final prompt
    fullPrompt = `I have the following files as context:\n\n${filesContext}\n\nQuestion: ${prompt}`;
    
    console.log(`[ASTER Debug] Total prompt size: ~${Math.round(totalPromptSize/1000)}K chars, Files: ${sortedFiles.length}`);
  }
  
  return {
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: fullPrompt }
    ]
  };
};

class AIService {
  async query(prompt, selectedFiles = [], defaultContext = '', signal, modelOverride = null, progressCallback = null) {
    // Get saved model or use override if provided
    const savedModel = modelOverride || await simpleStorage.getItem('ollama_model') || 'phi3:medium';
    
    console.log(`AIService.query called with model: ${savedModel}`);
    
    if (progressCallback) progressCallback('Preparing files...');
    
    // Track preparation time for very large inputs
    const startPrepTime = Date.now();
    const messageData = preparePromptWithContext(prompt, selectedFiles, defaultContext);
    const prepTime = Date.now() - startPrepTime;
    
    if (progressCallback) {
      if (prepTime > 5000) {
        progressCallback(`Files processed in ${Math.round(prepTime/1000)}s, sending to Ollama...`);
      } else {
        progressCallback('Files processed, sending to Ollama...');
      }
    }
    
    // Debug logging
    console.log('[ASTER Debug] Sending to Ollama:', {
      model: savedModel,
      promptLength: messageData.messages[1].content.length,
      numFiles: selectedFiles.length,
      fileNames: selectedFiles.map(f => f.name)
    });
    
    try {
      // Check if we should use streaming
      const useStreaming = await simpleStorage.getItem('use_streaming') || false;
      
      // For very large prompts, force streaming mode
      const forcedStreaming = messageData.messages[1].content.length > 100000;
      if (forcedStreaming && !useStreaming && progressCallback) {
        progressCallback('Large input detected - using streaming mode...');
      }
      
      if (useStreaming || forcedStreaming) {
        return await this.queryOllamaStreaming(messageData, signal, savedModel, progressCallback);
      } else {
        return await this.queryOllama(messageData, signal, savedModel, progressCallback);
      }
    } catch (error) {
      console.error('AI query error:', error);
      throw error;
    }
  }

  async queryOllama(messageData, signal, modelName, progressCallback = null) {
    try {
      // Get port from storage, default to 11434
      const port = await simpleStorage.getItem('ollama_port') || '11434';
      console.log(`Using Ollama port: ${port}, model: ${modelName}`);
      
      if (progressCallback) progressCallback('Formatting prompt...');
      
      const formattedPrompt = messageData.messages
        .map(msg => {
          if (msg.role === 'system') return `System: ${msg.content}\n\n`;
          if (msg.role === 'user') return `Human: ${msg.content}\n\n`;
          return '';
        })
        .join('') + 'Assistant:';

      if (progressCallback) progressCallback('Sending request to Ollama...');
      
      // Dynamically adjust context window based on prompt size
      const contextSize = formattedPrompt.length > 50000 ? 16384 : 
                         formattedPrompt.length > 20000 ? 8192 : 4096;
      
      // Log request info for debugging (truncate prompt in log)
      const requestBody = {
        model: modelName,
        prompt: formattedPrompt,
        options: {
          temperature: 0.7,
          num_ctx: contextSize
        },
        stream: false
      };
      
      console.log('[ASTER Debug] Ollama request prepared:', {
        endpoint: `http://localhost:${port}/api/generate`,
        model: modelName,
        contextSize: contextSize,
        promptFirstChars: formattedPrompt,
        promptLength: formattedPrompt.length
      });
      
      // Ollama API request with timeout scaled to prompt size
      const controller = new AbortController();
      // Adjust timeout based on input size
      const timeoutSeconds = Math.min(300, Math.max(120, Math.ceil(formattedPrompt.length / 1000)));
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`[ASTER Debug] Request timed out after ${timeoutSeconds} seconds`);
      }, timeoutSeconds * 1000);
      
      const combinedSignal = signal || controller.signal;
      
      // Start time for tracking
      const startTime = Date.now();
      
      // Set up progress updates with exponential backoff for longer requests
      let updateInterval = 3000; // Start with 3-second updates
      let lastUpdateTime = startTime;
      
      const progressInterval = setInterval(() => {
        if (progressCallback) {
          const now = Date.now();
          const timeElapsed = Math.round((now - startTime) / 1000);
          
          // For long-running requests, reduce update frequency to prevent UI spam
          if (timeElapsed > 60 && updateInterval < 10000) {
            updateInterval = 10000; // Increase to 10-second updates after 1 minute
          } else if (timeElapsed > 30 && updateInterval < 5000) {
            updateInterval = 5000; // Increase to 5-second updates after 30 seconds
          }
          
          // Only update if enough time has passed
          if (now - lastUpdateTime >= updateInterval) {
            progressCallback(`Waiting for Ollama response... (${timeElapsed}s)`);
            lastUpdateTime = now;
          }
        }
      }, 1000);
        
      const response = await fetch(`http://localhost:${port}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: combinedSignal
      });
      
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
      
      if (progressCallback) progressCallback('Processing response...');
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[ASTER Debug] Ollama API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Ollama API error: ${response.status}. ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        console.error('[ASTER Debug] Invalid Ollama response:', data);
        throw new Error("Invalid response from Ollama API");
      }
      
      const timeElapsed = (Date.now() - startTime) / 1000;
      console.log('[ASTER Debug] Ollama response received:', {
        responseLength: data.response.length,
        responseFirstChars: data.response.substring(0, 100) + '...',
        totalDuration: data.total_duration ? (data.total_duration / 1000000 + 'ms') : `${timeElapsed.toFixed(2)}s`,
        elapsedTime: `${timeElapsed.toFixed(2)}s`
      });
      
      return data.response.trim();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[ASTER Debug] Request aborted');
        throw error;
      }
      
      if (error.message.includes('Failed to fetch')) {
        console.error('[ASTER Debug] Connection error:', error);
        throw new Error('Failed to connect to Ollama. Please ensure Ollama is running on the configured port.');
      }
      console.error('[ASTER Debug] Other error:', error);
      throw error;
    }
  }
  
  async queryOllamaStreaming(messageData, signal, modelName, progressCallback = null) {
    try {
      // Get port from storage, default to 11434
      const port = await simpleStorage.getItem('ollama_port') || '11434';
      console.log(`Using Ollama streaming mode on port: ${port}, model: ${modelName}`);
      
      if (progressCallback) progressCallback('Formatting prompt for streaming...');
      
      const formattedPrompt = messageData.messages
        .map(msg => {
          if (msg.role === 'system') return `System: ${msg.content}\n\n`;
          if (msg.role === 'user') return `Human: ${msg.content}\n\n`;
          return '';
        })
        .join('') + 'Assistant:';
      
      if (progressCallback) progressCallback('Sending streaming request to Ollama...');
      
      // Dynamically adjust context window based on prompt size
      const contextSize = formattedPrompt.length > 50000 ? 16384 : 
                         formattedPrompt.length > 20000 ? 8192 : 4096;
      
      // Log request for debugging (truncate prompt in log)
      const requestBody = {
        model: modelName,
        prompt: formattedPrompt,
        options: {
          temperature: 0.7,
          num_ctx: contextSize
        },
        stream: true // Enable streaming
      };
      
      console.log('[ASTER Debug] Ollama streaming request prepared:', {
        endpoint: `http://localhost:${port}/api/generate`,
        model: modelName,
        contextSize: contextSize,
        promptLength: formattedPrompt.length
      });
      
      // Set up controller and timeout scaled by input size
      const controller = new AbortController();
      // Longer timeout for streaming mode
      const timeoutSeconds = Math.min(600, Math.max(180, Math.ceil(formattedPrompt.length / 500)));
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`[ASTER Debug] Streaming request timed out after ${timeoutSeconds} seconds`);
      }, timeoutSeconds * 1000);
      
      const combinedSignal = signal || controller.signal;
      
      // Start time for tracking
      const startTime = Date.now();
      let lastProgressUpdate = Date.now();
      let fullResponse = '';
      let responseStarted = false;
      let tokenCount = 0;
      let lastUpdateTokenCount = 0;
      
      try {
        const response = await fetch(`http://localhost:${port}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: combinedSignal
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error: ${response.status}. ${errorText}`);
        }
        
        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // For tracking token generation rate
        let tokenRateStartTime = Date.now();
        let tokenRateCount = 0;
        let tokensPerSecond = 0;
        
        // Process the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          
          try {
            // Process each line (each JSON object)
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              const data = JSON.parse(line);
              
              if (data.response) {
                // Accumulate response
                fullResponse += data.response;
                
                // Count tokens (approximation)
                const tokens = data.response.split(/\s+/).length;
                tokenCount += tokens;
                tokenRateCount += tokens;
                
                // Calculate tokens per second every 10 tokens
                if (tokenRateCount >= 10) {
                  const timeDiff = (Date.now() - tokenRateStartTime) / 1000;
                  if (timeDiff > 0) {
                    tokensPerSecond = Math.round(tokenRateCount / timeDiff);
                    tokenRateStartTime = Date.now();
                    tokenRateCount = 0;
                  }
                }
                
                // Update progress every 1.5 seconds or when enough new tokens generated
                const now = Date.now();
                const tokenDiff = tokenCount - lastUpdateTokenCount;
                if (!responseStarted || now - lastProgressUpdate > 1500 || tokenDiff > 20) {
                  if (!responseStarted) {
                    if (progressCallback) progressCallback('First tokens received, generating response...');
                    responseStarted = true;
                  } else {
                    // Show progress based on tokens received and time
                    const timeElapsed = Math.round((now - startTime) / 1000);
                    const rateInfo = tokensPerSecond > 0 ? ` at ~${tokensPerSecond} tokens/sec` : '';
                    if (progressCallback) {
                      progressCallback(`Generating response... (${tokenCount} tokens, ${timeElapsed}s${rateInfo})`);
                    }
                  }
                  lastProgressUpdate = now;
                  lastUpdateTokenCount = tokenCount;
                }
              }
              
              // If this is the done message
              if (data.done) {
                const timeElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log('[ASTER Debug] Streaming complete:', {
                  responseLength: fullResponse.length,
                  tokens: tokenCount,
                  elapsedTime: `${timeElapsed}s`,
                  averageRate: `${Math.round(tokenCount / parseFloat(timeElapsed))} tokens/sec`
                });
              }
            }
          } catch (e) {
            console.error('Error parsing JSON from stream:', e);
          }
        }
        
        clearTimeout(timeoutId);
        return fullResponse.trim();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[ASTER Debug] Streaming request aborted');
        throw error;
      }
      
      console.error('[ASTER Debug] Streaming error:', error);
      throw error;
    }
  }
}

const aiService = new AIService();
export default aiService;