import React from 'react';
import { DollarSign } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: {
      container: 'p-1.5',
      icon: 20,
      text: 'text-lg'
    },
    md: {
      container: 'p-2',
      icon: 24,
      text: 'text-xl'
    },
    lg: {
      container: 'p-3',
      icon: 32,
      text: 'text-2xl'
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`bg-blue-600 ${sizes[size].container} rounded-lg mr-2`}>
        <DollarSign size={sizes[size].icon} className="text-white" />
      </div>
      <span className={`${sizes[size].text} font-bold text-white`}>DebtTracker</span>
    </div>
  );
};

export default Logo; 