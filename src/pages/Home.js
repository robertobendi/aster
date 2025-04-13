import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiSearch, FiCode, FiLayers } from 'react-icons/fi';
import NetworkBackground from '../components/layout/NetworkBackground';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const asteriskRef = useRef(null);

  // Handle mouse movement for the asterisk wobble effect
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate the offset based on mouse position (smaller values for subtler movement)
    const moveX = (clientX - centerX) / 30;
    const moveY = (clientY - centerY) / 30;
    
    setMousePosition({ x: moveX, y: moveY });
  };

  useEffect(() => {
    // Delay initial load animation
    setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    // Delay showing the content overlay by 1 second (1000ms)
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 1300);
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden flex items-center justify-center">
      {/* Network Background with stronger filter */}
      <div className="absolute inset-0 after:absolute after:inset-0 after:bg-black/70" style={{ zIndex: 1 }}>
        <NetworkBackground />
      </div>
      
      {/* Initial HUGE asterisk - centered fade out animation */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 
        ${showContent ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} 
        style={{ zIndex: 3 }}
      >
        <div className={`transform transition-all duration-1000 ${
          isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-90'
        }`}>
          <div className="text-[20rem] sm:text-[30rem] text-white leading-none">*</div>
        </div>
      </div>
      
      {/* Content Overlay that appears after initial logo animation */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 
        ${showContent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 3 }}
      >
        <div className="relative w-full max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between">
          {/* Left side - Text content */}
          <div className="md:w-1/2 mb-12 md:mb-0 md:pr-8">
            {/* ASTER text and tagline */}
            <div className="md:text-left">
              <h1 className="text-6xl md:text-7xl font-light tracking-[0.2em] text-white mb-2">
                ASTER
              </h1>
              <p className="text-sm text-gray-400 tracking-[0.15em] uppercase">
                Automated Structuring and Tailored Editing for Reinsurance
              </p>
              
              <div className="h-px w-24 bg-gray-700 my-8"></div>
              
              <h2 className="text-xl font-light tracking-wider text-gray-200 mb-6">
               Optimized. Modular. Intelligent.
              </h2>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-10 pr-4 max-w-xl">
              ASTER turns unstructured documents into structured intelligence 
              — uncover hidden insights, map connections, and unlock the full 
              power of your data.


              </p>
              
              {/* Feature list */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <FiDownload className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">Format Conversion</h3>
                    <p className="text-xs text-gray-400">Standardize any document format into structured data</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <FiLayers className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">Schema Extraction</h3>
                    <p className="text-xs text-gray-400">Automatically detect and map document structure</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <FiSearch className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">Pattern Discovery</h3>
                    <p className="text-xs text-gray-400">Find hidden connections across documents</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <FiCode className="w-5 h-5 text-white/70" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">Query Your Data</h3>
                    <p className="text-xs text-gray-400">Extract precise insights with natural language</p>
                  </div>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="md:text-left">
                <Link
                  to="/dashboard"
                  className="inline-block bg-white text-black px-12 py-4 tracking-[0.1em] text-sm uppercase hover:bg-gray-100 transition-colors"
                >
                  Start Processing →
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right side - Thick Square Asterisk SVG */}
          <div className="md:w-1/2 flex justify-center items-center relative">
            <div 
              className="relative transition-all duration-700 ease-out"
              style={{ 
                transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
              }}
            >
              <svg 
                viewBox="0 0 100 100" 
                width="300" 
                height="300" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path 
                  d="M50 5L50 95M5 50L95 50M15 15L85 85M15 85L85 15" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeLinecap="square"
                />
              </svg>
            </div>
            
            {/* Version indicator */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-600">v1.0.4</div>
          </div>
        </div>
      </div>
      
      {/* Add subtle floating animation for particles */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px);
          }
          100% {
            transform: translate(0, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;