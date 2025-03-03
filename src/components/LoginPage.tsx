import React from 'react';
import AuthContainer from './AuthContainer';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 p-4">
        <div className="container mx-auto">
          <Link to="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
            <ArrowLeft size={18} className="mr-2" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>
      
      {/* Login Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <AuthContainer />
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 py-4">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} DebtTracker. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;