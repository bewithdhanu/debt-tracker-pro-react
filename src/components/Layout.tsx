import React, { ReactNode, useState } from 'react';
import { User } from '../types/auth';
import { LogOut, Menu, X, Home, Users, DollarSign, Settings, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface LayoutProps {
  user: User;
  children: ReactNode;
  activePage: 'dashboard' | 'debts' | 'contacts' | 'profile' | 'transactions';
}

const Layout: React.FC<LayoutProps> = ({ user, children, activePage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { clearUser } = useUser();

  const handleSignOut = async () => {
    try {
      // Clear user state first
      clearUser();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Show success message
      toast.success('Signed out successfully');
      
      // Redirect to login
      navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred while signing out');
      }
      console.error('Sign out error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 p-3 flex justify-between items-center border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">
          {user.name ? `${user.name.split(' ')[0]}'s Portal` : 'Portal'}
        </h1>
        <button
          onClick={toggleMobileMenu}
          className="text-gray-300 hover:text-white"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar - Mobile (Overlay) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-950 bg-opacity-90 z-50 flex flex-col">
          <div className="flex justify-end p-3">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex flex-col p-4 space-y-3">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-3">
                <span className="text-lg font-bold text-blue-500">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">
                  {user.name || 'User'}
                </h2>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>

            <NavLink
              to="/"
              icon={<Home size={18} />}
              text="Dashboard"
              isActive={activePage === 'dashboard'}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavLink
              to="/debts"
              icon={<DollarSign size={18} />}
              text="Debts"
              isActive={activePage === 'debts'}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavLink
              to="/contacts"
              icon={<Users size={18} />}
              text="Contacts"
              isActive={activePage === 'contacts'}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavLink
              to="/transactions"
              icon={<Receipt size={18} />}
              text="Transactions"
              isActive={activePage === 'transactions'}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className="mt-auto pt-4">
              <NavLink
                to="/profile"
                icon={<Settings size={18} />}
                text="Profile & Settings"
                isActive={activePage === 'profile'}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-300 text-sm mt-2"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-56 bg-gray-900 border-r border-gray-800 flex-col h-screen sticky top-0">
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-3">
              <span className="text-lg font-bold text-blue-500">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {user.name || 'User'}
              </h2>
              <p className="text-xs text-gray-400 truncate max-w-[120px]">{user.email}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <NavLink
              to="/"
              icon={<Home size={18} />}
              text="Dashboard"
              isActive={activePage === 'dashboard'}
            />
            <NavLink
              to="/debts"
              icon={<DollarSign size={18} />}
              text="Debts"
              isActive={activePage === 'debts'}
            />
            <NavLink
              to="/contacts"
              icon={<Users size={18} />}
              text="Contacts"
              isActive={activePage === 'contacts'}
            />
            <NavLink
              to="/transactions"
              icon={<Receipt size={18} />}
              text="Transactions"
              isActive={activePage === 'transactions'}
            />
          </nav>

          <div className="mt-auto pt-4">
            <NavLink
              to="/profile"
              icon={<Settings size={18} />}
              text="Profile & Settings"
              isActive={activePage === 'profile'}
            />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-300 text-sm mt-2"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-950 p-3 md:p-4">
        {children}
      </div>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, text, isActive, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </Link>
  );
};

export default Layout;