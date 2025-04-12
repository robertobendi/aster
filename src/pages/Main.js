import { FiUpload, FiBarChart2 } from 'react-icons/fi';
import { Tabs, TabList, TabButton, TabPanel, TabPanels } from '../components/Tabs/Tabs.js';
import FilesTab from '../components/Tabs/FilesTab';
import DashboardTab from '../components/Tabs/DashboardTab';

const Main = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="max-w-container mx-auto px-container-default">
        
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