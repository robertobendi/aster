import { useState } from 'react';
import { FiUpload, FiBarChart2 } from 'react-icons/fi';
import { Tabs, TabList, TabButton, TabPanel, TabPanels } from '../components/Tabs';
import FilesTab from './FilesTab';
import DashboardTab from './DashboardTab';

const Main = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="max-w-container mx-auto px-container-default py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-medium">ASTER Central Nexus</h1>
          <div className="text-sm text-text-secondary">
            <span>AI-Powered Reinsurance Underwriting</span>
          </div>
        </div>
        
        <Tabs defaultTab="files">
          <TabList>
            <TabButton 
              value="files" 
              label={
                <div className="flex items-center">
                  <FiUpload className="mr-2" /> Files
                </div>
              } 
            />
            <TabButton 
              value="dashboard" 
              label={
                <div className="flex items-center">
                  <FiBarChart2 className="mr-2" /> Dashboard
                </div>
              } 
            />
          </TabList>
          
          <TabPanels>
            <TabPanel value="files">
              <FilesTab />
            </TabPanel>
            
            <TabPanel value="dashboard">
              <DashboardTab />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
};

export default Main;