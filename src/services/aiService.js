import simpleStorage from '../utils/simpleStorage';

/**
 * Prepares the prompt with file contexts
 */
const preparePromptWithContext = (prompt, selectedFiles = [], defaultContext = '') => {
  console.log("Preparing prompt with", selectedFiles.length, "files");
  
  let fullPrompt = prompt;
  let systemMessage = 'You are ASTER, an AI assistant.';
  
  // Add default context if available
  if (defaultContext && defaultContext.trim()) {
    systemMessage += `\n\nAdditional context: ${defaultContext}`;
  }
  
  // Add file content as context
  if (selectedFiles.length > 0) {
    const filesContext = selectedFiles.map(file => {
      let fileContent = '';
      
      // Extract meaningful content based on file type
      if (file.jsonData) {
        if (file.extension === 'md' && file.jsonData.content) {
          fileContent = file.jsonData.content;
        } else if (file.extension === 'csv' && file.jsonData.data) {
          // For CSV, provide a sample of the data
          const data = file.jsonData.data;
          const sample = data.slice(0, Math.min(10, data.length));
          fileContent = `Headers: ${file.jsonData.headers.join(', ')}\nSample data (${sample.length} of ${data.length} rows):\n`;
          
          sample.forEach(row => {
            fileContent += JSON.stringify(row) + '\n';
          });
        } else if (file.extension === 'xlsx' && file.jsonData.sheets) {
          // For Excel, provide info about sheets and a sample from the first sheet
          const sheetNames = file.jsonData.sheetNames || [];
          fileContent = `Excel file with sheets: ${sheetNames.join(', ')}\n`;
          
          if (sheetNames.length > 0) {
            const firstSheet = file.jsonData.sheets[sheetNames[0]];
            if (firstSheet && firstSheet.data) {
              const sample = firstSheet.data.slice(0, Math.min(5, firstSheet.data.length));
              fileContent += `Sample from ${sheetNames[0]} (${sample.length} of ${firstSheet.data.length} rows):\n`;
              
              sample.forEach(row => {
                fileContent += JSON.stringify(row) + '\n';
              });
            }
          }
        } else if (file.extension === 'json') {
          // For JSON, provide a stringified version with truncation for large objects
          try {
            const jsonStr = JSON.stringify(file.jsonData.data, null, 2);
            fileContent = jsonStr.length > 2000 
              ? jsonStr.substring(0, 2000) + '... (truncated)'
              : jsonStr;
          } catch (e) {
            fileContent = 'Unable to stringify JSON content';
          }
        }
      }
      
      return `--- FILE: ${file.name} ---\n${fileContent}\n`;
    }).join('\n');
    
    fullPrompt = `I have the following files as context:\n\n${filesContext}\n\nQuestion: ${prompt}`;
  }
  
  return {
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: fullPrompt }
    ]
  };
};

class AIService {
  async query(prompt, selectedFiles = [], defaultContext = '', signal, modelOverride = null) {
    // Get saved model or use override if provided
    const savedModel = modelOverride || await simpleStorage.getItem('ollama_model') || 'phi3:medium';
    
    console.log(`AIService.query called with model: ${savedModel}`);
    
    const messageData = preparePromptWithContext(prompt, selectedFiles, defaultContext);
    
    try {
      return await this.queryOllama(messageData, signal, savedModel);
    } catch (error) {
      console.error('AI query error:', error);
      throw error;
    }
  }

  async queryOllama(messageData, signal, modelName) {
    try {
      // Get port from storage, default to 11434
      const port = await simpleStorage.getItem('ollama_port') || '11434';
      console.log(`Using Ollama port: ${port}, model: ${modelName}`);
      
      const formattedPrompt = messageData.messages
        .map(msg => {
          if (msg.role === 'system') return `System: ${msg.content}\n\n`;
          if (msg.role === 'user') return `Human: ${msg.content}\n\n`;
          return '';
        })
        .join('') + 'Assistant:';

      // Log request body for debugging
      const requestBody = {
        model: modelName,
        prompt: formattedPrompt,
        options: {
          temperature: 0.7,
          num_ctx: 4096
        },
        stream: false
      };
      
      // Ollama API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const combinedSignal = signal || controller.signal;
        
      const response = await fetch(`http://localhost:${port}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: combinedSignal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Ollama API error: ${response.status}. ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error("Invalid response from Ollama API");
      }
      
      return data.response.trim();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Failed to connect to Ollama. Please ensure Ollama is running on the configured port.');
      }
      throw error;
    }
  }
}

const aiService = new AIService();
export default aiService;