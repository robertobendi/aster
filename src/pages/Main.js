// src/pages/Main.jsx
import React, { useState } from "react";
import { FiUpload, FiBarChart2, FiCpu, FiSettings, FiEye } from "react-icons/fi";

// Your tab system
import { Tabs, TabList, TabButton, TabPanel, TabPanels } from "../components/Tabs/Tabs.js";

// Existing tab components
import FilesTab from "../components/Tabs/FilesTab";
import ComputeTab from "../components/Tabs/ComputeTab";
import SettingsTab from "../components/Tabs/SettingsTab";
import ViewTab from "../components/Tabs/ViewTab";

const Main = () => {
  // 2) Store blocks here, so they're shared
  const [blocks, setBlocks] = useState([]);

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
              value="compute" 
              label={
                <div className="flex items-center">
                  <FiCpu className="mr-2" /> Compute
                </div>
              } 
            />
            <TabButton 
              value="settings" 
              label={
                <div className="flex items-center">
                  <FiSettings className="mr-2" /> Settings
                </div>
              } 
            />
            {/* Add a new "View" tab */}
            <TabButton 
              value="view" 
              label={
                <div className="flex items-center">
                  <FiEye className="mr-2" /> View
                </div>
              } 
            />
          </TabList>

          <TabPanels>
            <TabPanel value="files">
              <FilesTab />
            </TabPanel>

            {/* 3) Pass the parent's blocks/setBlocks to ComputeTab */}
            <TabPanel value="compute">
              <ComputeTab 
                blocks={blocks} 
                setBlocks={setBlocks} 
              />
            </TabPanel>

            <TabPanel value="view">
              <ViewTab blocks={blocks} />
            </TabPanel>

            <TabPanel value="settings">
              <SettingsTab />
            </TabPanel>

          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
};

export default Main;
