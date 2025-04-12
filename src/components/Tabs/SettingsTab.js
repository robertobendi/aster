import { useState, useEffect } from 'react';
import { FiSettings, FiSave, FiLoader } from 'react-icons/fi';
import simpleStorage from '../../utils/simpleStorage';

const SettingsTab = () => {
  const [hfToken, setHfToken] = useState('');
  const [context, setContext] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedToken = await simpleStorage.getItem('aster_hf_token') || '';
        const savedContext = await simpleStorage.getItem('aster_context') || '';
        setHfToken(savedToken);
        setContext(savedContext);
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
      await simpleStorage.setItem('aster_hf_token', hfToken);
      await simpleStorage.setItem('aster_context', context);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="bg-surface border border-border-primary rounded-lg p-6">
        <div className="flex items-center mb-6">
          <FiSettings className="w-5 h-5 mr-2 text-text-secondary" />
          <h2 className="text-xl font-medium">Settings</h2>
        </div>
        
        {/* Hugging Face Token */}
        <div className="mb-8">
          <label className="block text-text-primary mb-2 font-medium">
            Hugging Face API Token
          </label>
          <div className="mb-1 text-text-secondary text-sm">
            Get your free token from{' '}
            <a 
              href="https://huggingface.co/settings/tokens" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              huggingface.co/settings/tokens
            </a>
          </div>
          <div className="flex">
            <input
              type={showToken ? "text" : "password"}
              className="w-full p-3 bg-background border border-border-secondary rounded focus:outline-none focus:border-primary"
              placeholder="hf_..."
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
            />
            <button 
              className="ml-2 px-3 py-1 bg-surface border border-border-primary rounded hover:bg-background transition-all"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? "Hide" : "Show"}
            </button>
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