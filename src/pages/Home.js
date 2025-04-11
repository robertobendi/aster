import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import NetworkBackground from '../components/layout/NetworkBackground';

const Home = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const asteriskRef = useRef(null);

  // Handle mouse movement for the parallax effect
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate the offset based on mouse position (smaller values for subtler movement)
    const moveX = (clientX - centerX) / 50;
    const moveY = (clientY - centerY) / 50;
    
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
      
      {/* Initial HUGE asterisk - centered */}
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
      
      {/* Content Overlay that appears after initial logo */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 
        ${showContent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ zIndex: 3 }}
      >
        <div className="relative max-w-4xl w-full px-6">
          {/* ASTER text */}
          <div className="text-center mb-16">
            <div className="text-7xl sm:text-8xl tracking-[0.4em] text-white mb-4 mt-6">
              A S T E R
            </div>
          </div>
          
          {/* Content text without boxes */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-10 text-center">
            <div>
              <h2 className="text-sm tracking-[0.2em] uppercase text-gray-300 leading-relaxed">
                AI-Powered Reinsurance Underwriting
              </h2>
            </div>
            
            <div>
              <p className="text-sm text-gray-300 leading-loose">
                Streamline analysis • Visualize contracts • Empower decisions
              </p>
            </div>
          </div>
          
          {/* Feature circles - without box */}
          <div className="mb-16 relative">
            <div className="flex justify-between items-start mx-auto max-w-2xl">
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 rounded-full border border-gray-700 flex items-center justify-center mb-3 group-hover:border-white transition-all duration-300">
                  <svg className="w-7 h-7 text-gray-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 4H14V10L18.5 13.5L16.5 16.5L11 12V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors tracking-wider">Visualize</span>
              </div>
              
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 rounded-full border border-gray-700 flex items-center justify-center mb-3 group-hover:border-white transition-all duration-300">
                  <svg className="w-7 h-7 text-gray-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 4L21 9L12 14L3 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 14L12 19L3 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors tracking-wider">Analyze</span>
              </div>
              
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 rounded-full border border-gray-700 flex items-center justify-center mb-3 group-hover:border-white transition-all duration-300">
                  <svg className="w-7 h-7 text-gray-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors tracking-wider">Query</span>
              </div>
              
              <div className="flex flex-col items-center group">
                <div className="w-20 h-20 rounded-full border border-gray-700 flex items-center justify-center mb-3 group-hover:border-white transition-all duration-300">
                  <svg className="w-7 h-7 text-gray-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-white transition-colors tracking-wider">Decide</span>
              </div>
            </div>
          </div>
          
          {/* CTA Button - simplified */}
          <div className="text-center">
            <Link
              to="/dashboard"
              className="inline-block bg-white text-black px-12 py-4 tracking-[0.2em] text-sm uppercase hover:bg-gray-100 transition-colors"
            >
              Explore ASTER →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Remove the navigation since you already have it */}
    </div>
  );
};

export default Home;