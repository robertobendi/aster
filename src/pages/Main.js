import React, { useState } from "react";
import {
  FiUpload,
  FiBarChart2,
  FiCpu,
  FiSettings,
  FiEye,
} from "react-icons/fi";

import {
  Tabs,
  TabList,
  TabButton,
  TabPanel,
  TabPanels,
} from "../components/Tabs/Tabs.js";

// Tab components
import FilesTab from "../components/Tabs/FilesTab";
import ComputeTab from "../components/Tabs/ComputeTab";
import SettingsTab from "../components/Tabs/SettingsTab";
import ViewTab from "../components/Tabs/ViewTab";

const Main = () => {
  // Holds AI-generated "blocks" for the Compute & View tabs
  const [blocks, setBlocks] = useState([]);

  // 1) Holds the standardized files for global access
  const [standardizedFiles, setStandardizedFiles] = useState([]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <div className="max-w-container mx-auto px-container-default">

        <Tabs defaultTab="files">
          <TabList>
            <TabButton
              value="files"
              label={
                <div className="flex items-center">
                  <FiUpload className="mr-2" />
                  Files
                </div>
              }
            />
            <TabButton
              value="compute"
              label={
                <div className="flex items-center">
                  <FiCpu className="mr-2" />
                  Compute
                </div>
              }
            />
            <TabButton
              value="view"
              label={
                <div className="flex items-center">
                  <FiEye className="mr-2" />
                  View
                </div>
              }
            />
            <TabButton
              value="settings"
              label={
                <div className="flex items-center">
                  <FiSettings className="mr-2" />
                  Settings
                </div>
              }
            />
          </TabList>

          <TabPanels>
            <TabPanel value="files">
              {/* 2) Pass down setStandardizedFiles so FileUploader can call it */}
              <FilesTab onStandardizedFilesChange={setStandardizedFiles} />
            </TabPanel>

            <TabPanel value="compute">
              {/* 3) Pass blocks, setBlocks, AND standardizedFiles if you want 
                  ComputeTab to use them. */}
              <ComputeTab
                blocks={blocks}
                setBlocks={setBlocks}
                files={standardizedFiles} 
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
