import { useEffect } from 'react';

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
}

export const CustomScrollbar = ({ children, className = '' }: CustomScrollbarProps) => {
  useEffect(() => {
    // Add custom scrollbar styles to the document
    const style = document.createElement('style');
    style.textContent = `
      /* Custom Scrollbar Styles */
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(17, 24, 39, 0.8);
        border-radius: 10px;
        border: 1px solid rgba(75, 85, 99, 0.3);
      }

      ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(16, 185, 129, 0.8));
        border-radius: 10px;
        border: 2px solid rgba(17, 24, 39, 0.8);
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
        transition: all 0.3s ease;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, rgba(34, 197, 94, 1), rgba(16, 185, 129, 1));
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.5);
        transform: scale(1.05);
      }

      ::-webkit-scrollbar-thumb:active {
        background: linear-gradient(135deg, rgba(22, 163, 74, 1), rgba(5, 150, 105, 1));
        box-shadow: 0 2px 6px rgba(34, 197, 94, 0.7);
      }

      ::-webkit-scrollbar-corner {
        background: rgba(17, 24, 39, 0.8);
      }

      /* Firefox scrollbar styles */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(34, 197, 94, 0.8) rgba(17, 24, 39, 0.8);
      }

      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }

      /* Custom scrollbar for specific containers */
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(31, 41, 55, 0.6);
        border-radius: 8px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.7), rgba(16, 185, 129, 0.7));
        border-radius: 8px;
        border: 1px solid rgba(31, 41, 55, 0.8);
      }

      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9));
      }

      /* Enhanced scrollbar for main content */
      .main-scrollbar::-webkit-scrollbar {
        width: 14px;
        height: 14px;
      }

      .main-scrollbar::-webkit-scrollbar-track {
        background: linear-gradient(180deg, rgba(17, 24, 39, 0.9), rgba(31, 41, 55, 0.9));
        border-radius: 12px;
        border: 1px solid rgba(75, 85, 99, 0.4);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .main-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
        border-radius: 12px;
        border: 2px solid rgba(17, 24, 39, 0.9);
        box-shadow: 0 3px 10px rgba(34, 197, 94, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .main-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(34, 197, 94, 1), rgba(16, 185, 129, 1), rgba(5, 150, 105, 1));
        box-shadow: 0 5px 15px rgba(34, 197, 94, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      .main-scrollbar::-webkit-scrollbar-thumb:active {
        background: linear-gradient(180deg, rgba(22, 163, 74, 1), rgba(5, 150, 105, 1), rgba(4, 120, 87, 1));
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.8), inset 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .main-scrollbar::-webkit-scrollbar-corner {
        background: linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(31, 41, 55, 0.9));
      }

      /* Animated scrollbar for special sections */
      .animated-scrollbar::-webkit-scrollbar-thumb {
        animation: scrollbarGlow 2s ease-in-out infinite alternate;
      }

      @keyframes scrollbarGlow {
        0% {
          box-shadow: 0 3px 10px rgba(34, 197, 94, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }
        100% {
          box-shadow: 0 3px 10px rgba(34, 197, 94, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.2);
        }
      }
    `;
    
    document.head.appendChild(style);

    // Cleanup function to remove styles when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={`main-scrollbar ${className}`}>
      {children}
    </div>
  );
};

export default CustomScrollbar;
