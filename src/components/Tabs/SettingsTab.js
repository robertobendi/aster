import { useState, useEffect } from 'react';
import { FiSettings, FiSave, FiLoader, FiServer, FiCheck, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import simpleStorage from '../../utils/simpleStorage';

const SettingsTab = () => {
  const [context, setContext] = useState('');
  const [ollamaPort, setOllamaPort] = useState('11434');
  const [selectedModel, setSelectedModel] = useState('phi3:medium');
  const [availableModels, setAvailableModels] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null); // null, 'connected', 'error'
  const [saveStatus, setSaveStatus] = useState('');
  
  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedContext = await simpleStorage.getItem('aster_context') || '';
        setContext(savedContext);
        
        const savedPort = await simpleStorage.getItem('ollama_port') || '11434';
        setOllamaPort(savedPort);
        
        const savedModel = await simpleStorage.getItem('ollama_model') || 'phi3:medium';
        setSelectedModel(savedModel);
        
        // Test connection and get models on component mount
        fetchAvailableModels(savedPort);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings
  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      await simpleStorage.setItem('aster_context', context);
      await simpleStorage.setItem('ollama_port', ollamaPort);
      await simpleStorage.setItem('ollama_model', selectedModel);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Fetch available models from Ollama
  const fetchAvailableModels = async (port = ollamaPort) => {
    try {
      setConnectionStatus(null);
      const response = await fetch(`http://localhost:${port}/api/tags`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
          const modelNames = data.models.map(m => m.name);
          setAvailableModels(modelNames);
          setConnectionStatus('connected');
          
          // If current selected model is not in available models, select the first one
          if (modelNames.length > 0 && !modelNames.includes(selectedModel)) {
            setSelectedModel(modelNames[0]);
          }
          
          return modelNames;
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        throw new Error(`HTTP error ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setConnectionStatus('error');
      setAvailableModels([]);
      return [];
    }
  };

  // Test Ollama connection
  const testOllamaConnection = async () => {
    try {
      const models = await fetchAvailableModels();
      if (models.length > 0) {
        alert(`Connected to Ollama! Available models: ${models.join(', ')}`);
      } else {
        alert('Connected to Ollama, but no models found. Use "ollama pull <model-name>" to download models.');
      }
    } catch (error) {
      alert(`Error connecting to Ollama: ${error.message}`);
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="bg-surface border border-border-primary rounded-lg p-6">
        <div className="flex items-center mb-6">
          <FiSettings className="w-5 h-5 mr-2 text-text-secondary" />
          <h2 className="text-xl font-medium">Settings</h2>
        </div>
        
        {/* Ollama Configuration */}
        <div className="mb-8">
          <label className="block text-text-primary mb-2 font-medium">
            Ollama Configuration
          </label>
          
          {/* Ollama Port */}
          <div className="mb-4">
            <label className="block text-text-secondary text-sm mb-1">
              Ollama Port
            </label>
            <div className="flex items-center">
              <div className="flex items-center">
                <span className="px-3 py-2 bg-background border border-r-0 border-border-secondary rounded-l text-text-secondary">
                  http://localhost:
                </span>
                <input
                  type="text"
                  className="p-2 bg-background border border-border-secondary rounded-r focus:outline-none focus:border-primary w-24"
                  value={ollamaPort}
                  onChange={(e) => setOllamaPort(e.target.value)}
                  placeholder="11434"
                />
              </div>
              <button
                className="ml-2 px-3 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center"
                onClick={testOllamaConnection}
              >
                <FiServer className="mr-1" /> Test Connection
              </button>
              
              {connectionStatus === 'connected' && (
                <span className="ml-2 text-status-success flex items-center text-sm">
                  <FiCheck className="mr-1" /> Connected
                </span>
              )}
              
              {connectionStatus === 'error' && (
                <span className="ml-2 text-status-error flex items-center text-sm">
                  <FiAlertCircle className="mr-1" /> Connection error
                </span>
              )}
            </div>
          </div>
          
          {/* Model Selection */}
          <div className="mb-4">
            <label className="block text-text-secondary text-sm mb-1">
              Ollama Model
            </label>
            <div className="flex items-center">
              <select
                className="p-2 bg-background border border-border-secondary rounded focus:outline-none focus:border-primary"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={availableModels.length === 0}
              >
                {availableModels.length === 0 ? (
                  <option value="">No models available</option>
                ) : (
                  availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))
                )}
              </select>
              
              <button
                className="ml-2 px-3 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all flex items-center text-sm"
                onClick={() => fetchAvailableModels()}
              >
                <FiRefreshCw className="mr-1" /> Refresh Models
              </button>
            </div>
          </div>
          
          <div className="text-text-secondary text-sm">
            Use <code>ollama pull &lt;model-name&gt;</code> to add more models to your Ollama instance
          </div>
        </div>
  
        {/* Default Context */}
        <div className="mb-8">
          <label className="block text-text-primary mb-2 font-medium">
            Default Context
          </label>
          <div className="mb-1 text-text-secondary text-sm">
            Add any default information to include with all AI queries.
          </div>
          <textarea
            className="w-full p-3 bg-background border border-border-secondary rounded focus:outline-none focus:border-primary min-h-[150px]"
            placeholder="Enter default context here..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-primary text-background rounded hover:bg-opacity-90 transition-all flex items-center"
            onClick={saveSettings}
          >
            {saveStatus === 'saved' ? (
              <>
                <FiSave className="mr-2" /> Saved!
              </>
            ) : saveStatus === 'saving' ? (
              <>
                <FiLoader className="mr-2 animate-spin" /> Saving...
              </>
            ) : saveStatus === 'error' ? (
              <>
                <FiSave className="mr-2" /> Error Saving
              </>
            ) : (
              <>
                <FiSave className="mr-2" /> Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;