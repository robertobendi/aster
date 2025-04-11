import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Icons component for consistent icon usage
const DashboardIcon = () => (
  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" 
    />
  </svg>
);

// Empty state component
const EmptyState = ({ onAddBlock }) => (
  <div className="bg-surface border border-border-primary rounded p-12 text-center flex flex-col items-center justify-center">
    <DashboardIcon />
    <h3 className="mt-6 text-lg font-medium text-text-primary">No dashboard blocks yet</h3>
    <p className="mt-2 text-text-secondary">Get started by adding your first dashboard block.</p>
    <button 
      className="mt-8 px-6 py-2 bg-surface border border-border-primary text-text-primary rounded hover:bg-background transition-all"
      onClick={onAddBlock}
    >
      Add Your First Block
    </button>
  </div>
);

// Block container component for reusability
const BlockContainer = ({ children, className = "" }) => (
  <div className={`bg-surface border border-border-primary p-6 rounded ${className}`}>
    {children}
  </div>
);

// Placeholder block component
const PlaceholderBlock = ({ number }) => (
  <BlockContainer className="flex items-center justify-center border-dashed min-h-[180px]">
    <p className="text-text-secondary">Block placeholder {number}</p>
  </BlockContainer>
);

// Main Dashboard component
const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [blocks, setBlocks] = useState([]);
  const [showGrid, setShowGrid] = useState(true);

  // Simulating data fetch
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Placeholder data structure for blocks
        const mockData = [
          // You'll replace these with actual block data
        ];
        
        setBlocks(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    // Simulate loading time
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Function to handle adding a new block
  const handleAddBlock = () => {
    console.log("Opening add block dialog");
    // This will be implemented later when you create the block components
  };

  // Function to remove a block
  const handleRemoveBlock = (blockId) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
  };

  // Function to update a block's data
  const handleUpdateBlock = (blockId, newData) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, ...newData } : block
    ));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-secondary border-t-text-primary"></div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background text-text-primary">
        {/* Dashboard Header */}
        <div className="border-b border-border-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-medium">Dashboard</h1>
            
            <button 
              className="px-4 py-2 bg-surface border border-border-primary rounded hover:bg-background transition-all"
              onClick={handleAddBlock}
            >
              Add Block
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Point grid background - visible when showGrid is true */}
          {showGrid && (
            <div className="fixed inset-0 z-0 pointer-events-none" 
                 style={{
                   backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                   backgroundSize: '24px 24px',
                   opacity: 0.2
                 }} />
          )}

          {/* Empty state when no blocks */}
          {blocks.length === 0 && (
            <EmptyState onAddBlock={handleAddBlock} />
          )}

          {/* Grid for blocks - will only show when there are blocks */}
          {blocks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blocks.map((block, index) => (
                <div key={block.id}>
                  {/* You'll replace this with actual block components */}
                  <p>Block {index + 1}</p>
                </div>
              ))}
            </div>
          )}

          {/* Placeholder grid - will show regardless for development */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PlaceholderBlock number={1} />
            <PlaceholderBlock number={2} />
            <PlaceholderBlock number={3} />
          </div>
          
          {/* Modular areas for future block layouts */}
          <div className="mt-12 space-y-6">
            {/* Full width block area */}
            <BlockContainer className="min-h-[220px] flex items-center justify-center border-dashed">
              <p className="text-text-secondary">Full width block area</p>
            </BlockContainer>
            
            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BlockContainer className="min-h-[180px] flex items-center justify-center border-dashed">
                <p className="text-text-secondary">Half width block</p>
              </BlockContainer>
              <BlockContainer className="min-h-[180px] flex items-center justify-center border-dashed">
                <p className="text-text-secondary">Half width block</p>
              </BlockContainer>
            </div>
            
            {/* Three small blocks row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <BlockContainer className="min-h-[140px] flex items-center justify-center border-dashed">
                <p className="text-text-secondary">1/3 block</p>
              </BlockContainer>
              <BlockContainer className="min-h-[140px] flex items-center justify-center border-dashed">
                <p className="text-text-secondary">1/3 block</p>
              </BlockContainer>
              <BlockContainer className="min-h-[140px] flex items-center justify-center border-dashed">
                <p className="text-text-secondary">1/3 block</p>
              </BlockContainer>
            </div>
          </div>
          
          {/* Grid controls - for development purposes */}
          <div className="mt-12 text-right">
            <button 
              className="text-text-secondary text-sm hover:text-text-primary"
              onClick={() => setShowGrid(!showGrid)}
            >
              {showGrid ? 'Hide Grid' : 'Show Grid'}
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default Dashboard;