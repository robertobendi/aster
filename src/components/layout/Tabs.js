import React, { useState, createContext, useContext } from 'react';

// Create a context for the tab state
const TabContext = createContext();

// Tab components
export const TabList = ({ children }) => {
  return (
    <div className="flex border-b border-border-secondary mb-6 overflow-x-auto">
      {children}
    </div>
  );
};

export const TabButton = ({ label, value }) => {
  const { activeTab, setActiveTab } = useContext(TabContext);
  
  return (
    <button
      className={`px-4 py-3 border-b-2 whitespace-nowrap transition-all
        ${activeTab === value 
          ? 'border-primary text-text-primary font-medium' 
          : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
        }`}
      onClick={() => setActiveTab(value)}
    >
      {label}
    </button>
  );
};

export const TabPanels = ({ children }) => {
  return <div className="w-full">{children}</div>;
};

export const TabPanel = ({ value, children }) => {
  const { activeTab } = useContext(TabContext);
  
  return (
    <div className={activeTab === value ? 'block' : 'hidden'}>
      {children}
    </div>
  );
};

// Main Tabs component
export const Tabs = ({ children, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="w-full">
        {children}
      </div>
    </TabContext.Provider>
  );
};