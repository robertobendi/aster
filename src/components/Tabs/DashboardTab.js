import { FiBarChart2, FiGrid, FiPieChart, FiFileText } from 'react-icons/fi';

const DashboardTab = () => {
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="bg-surface border border-border-primary rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FiBarChart2 className="w-5 h-5 mr-2 text-text-secondary" />
          <h2 className="text-xl font-medium">Visualization Dashboard</h2>
        </div>
        <div className="border border-border-secondary rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center max-w-lg">
            <div className="text-6xl mb-6">*</div>
            <h3 className="text-xl mb-4 text-text-primary">Coming Soon</h3>
            <p className="text-text-secondary">
              The visualization dashboard will provide advanced analytics and visual representations of your standardized data.
            </p>
            <div className="mt-6 text-xs text-text-secondary flex flex-col items-center gap-2">
              <p>ASTER - Central Nexus</p>
              <div className="flex gap-6 mt-2">
                <div className="flex flex-col items-center">
                  <span className="text-status-success">Visualize</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-status-success">Analyze</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-status-success">Query</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-status-success">Decide</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Placeholder for future dashboard components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border-primary rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiGrid className="w-5 h-5 mr-2 text-text-secondary" />
            <h2 className="text-lg font-medium">Data Summary</h2>
          </div>
          <div className="border border-border-secondary rounded-lg p-6 min-h-[200px] flex items-center justify-center">
            <p className="text-text-secondary">Data summary will appear here</p>
          </div>
        </div>
        
        <div className="bg-surface border border-border-primary rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiPieChart className="w-5 h-5 mr-2 text-text-secondary" />
            <h2 className="text-lg font-medium">File Type Distribution</h2>
          </div>
          <div className="border border-border-secondary rounded-lg p-6 min-h-[200px] flex items-center justify-center">
            <p className="text-text-secondary">File type chart will appear here</p>
          </div>
        </div>
      </div>
      
      <div className="bg-surface border border-border-primary rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FiFileText className="w-5 h-5 mr-2 text-text-secondary" />
          <h2 className="text-lg font-medium">Recent Files</h2>
        </div>
        <div className="border border-border-secondary rounded-lg p-6 min-h-[200px] flex items-center justify-center">
          <p className="text-text-secondary">Recent files will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;