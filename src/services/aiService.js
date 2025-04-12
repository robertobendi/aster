import { preparePromptWithContext, simulateAIResponse } from '../utils/contextUtils';
import simpleStorage from '../utils/simpleStorage';

class AIService {
  async getToken() {
    try {
      return await simpleStorage.getItem('aster_hf_token');
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }
  
  async query(prompt, selectedFiles = [], defaultContext = '') {
    const token = await this.getToken();
    
    if (!token) {
      return simulateAIResponse(prompt, selectedFiles);
    }
    
    const messageData = preparePromptWithContext(prompt, selectedFiles, defaultContext);
    
    try {
      return await this.queryHuggingFace(messageData, token);
    } catch (error) {
      console.error('AI query error:', error);
      throw error;
    }
  }
  
  async queryHuggingFace(messageData, token) {
    const formattedPrompt = messageData.messages.map(msg => {
      if (msg.role === 'system') return `System: ${msg.content}\n\n`;
      if (msg.role === 'user') return `Human: ${msg.content}\n\n`;
      if (msg.role === 'assistant') return `Assistant: ${msg.content}\n\n`;
      return '';
    }).join('') + 'Assistant:';
    
    const model = 'mistralai/Mistral-7B-Instruct-v0.2';
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: formattedPrompt,
        parameters: {
          max_new_tokens: 800,
          temperature: 0.7,
          return_full_text: false
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Hugging Face API error: ${response.status}. ${errorText}`);
    }
    
    try {
      const data = await response.json();
      
      if (Array.isArray(data) && data[0] && data[0].generated_text) {
        return data[0].generated_text.trim();
      } else if (typeof data === 'object' && data.generated_text) {
        return data.generated_text.trim();
      } else if (typeof data === 'string') {
        return data.trim();
      }
      
      return JSON.stringify(data);
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Failed to parse response from Hugging Face');
    }
  }
}

const aiService = new AIService();
export default aiService;