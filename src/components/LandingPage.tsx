import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  BarChart4, 
  ChevronRight,
  Menu,
  X,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import LandingNav from './LandingNav';

const LandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Update active section based on scroll position
      const sections = ['hero', 'features', 'testimonials', 'pricing', 'faq'];
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-2">
                <DollarSign size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold">DebtTracker</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className={`text-sm font-medium hover:text-blue-400 transition-colors ${activeSection === 'features' ? 'text-blue-400' : 'text-gray-300'}`}>Features</a>
              <a href="#testimonials" className={`text-sm font-medium hover:text-blue-400 transition-colors ${activeSection === 'testimonials' ? 'text-blue-400' : 'text-gray-300'}`}>Testimonials</a>
              <a href="#pricing" className={`text-sm font-medium hover:text-blue-400 transition-colors ${activeSection === 'pricing' ? 'text-blue-400' : 'text-gray-300'}`}>Pricing</a>
              <a href="#faq" className={`text-sm font-medium hover:text-blue-400 transition-colors ${activeSection === 'faq' ? 'text-blue-400' : 'text-gray-300'}`}>FAQ</a>
              <Link to="/login" className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                Sign In
              </Link>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMenu}
                className="text-gray-300 hover:text-white"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-gray-900 shadow-xl">
            <div className="px-4 py-3 space-y-3">
              <a 
                href="#features" 
                className="block text-gray-300 hover:text-white py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#testimonials" 
                className="block text-gray-300 hover:text-white py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Testimonials
              </a>
              <a 
                href="#pricing" 
                className="block text-gray-300 hover:text-white py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#faq" 
                className="block text-gray-300 hover:text-white py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </a>
              <Link 
                to="/login" 
                className="block text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12">
              <div className="animate-fade-in-up">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                  <span className="text-blue-400">Track</span> Your Debts,
                  <br />
                  <span className="text-blue-400">Manage</span> Your Money
                </h1>
                <p className="text-gray-300 text-lg md:text-xl mb-8">
                  A powerful, intuitive platform to track personal loans and debts. 
                  Never lose track of who owes you and what you owe.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/login" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    Get Started <ArrowRight size={18} className="ml-2" />
                  </Link>
                  <a 
                    href="#features" 
                    className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
                  >
                    Learn More <ChevronRight size={18} className="ml-1" />
                  </a>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 mt-12 md:mt-0">
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-10 blur-xl transform -rotate-6"></div>
                <img 
                  src="https://images.unsplash.com/photo-1579621970795-87facc2f976d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" 
                  alt="Debt Tracker Dashboard" 
                  className="relative z-10 rounded-lg shadow-2xl border border-gray-800"
                />
                <div className="absolute -bottom-4 -right-4 bg-blue-600 p-4 rounded-lg shadow-lg z-20 animate-pulse-slow">
                  <TrendingUp size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 md:mt-24">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 transform transition-transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600/20 p-3 rounded-full mr-4">
                  <Users size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">10,000+</h3>
                  <p className="text-gray-400">Active Users</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 transform transition-transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-green-600/20 p-3 rounded-full mr-4">
                  <DollarSign size={24} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">$5M+</h3>
                  <p className="text-gray-400">Debts Tracked</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 transform transition-transform hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="bg-purple-600/20 p-3 rounded-full mr-4">
                  <Shield size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">99.9%</h3>
                  <p className="text-gray-400">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Everything you need to manage your personal finances and keep track of debts in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="bg-blue-600/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <DollarSign size={24} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Debt Tracking</h3>
              <p className="text-gray-300">
                Easily record and manage both money you owe and money owed to you with detailed records.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="bg-green-600/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <TrendingUp size={24} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Interest Calculation</h3>
              <p className="text-gray-300">
                Automatically calculate interest payments based on your specified rates and payment schedules.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="bg-purple-600/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Users size={24} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Contact Management</h3>
              <p className="text-gray-300">
                Organize your contacts with detailed profiles and track all debts associated with each person.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="bg-yellow-600/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <BarChart4 size={24} className="text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Financial Dashboard</h3>
              <p className="text-gray-300">
                Get a comprehensive overview of your financial situation with intuitive visualizations.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="bg-red-600/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Shield size={24} className="text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-gray-300">
                Your financial data is encrypted and protected with industry-standard security measures.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="bg-indigo-600/20 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <TrendingUp size={24} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Transaction History</h3>
              <p className="text-gray-300">
                Keep a detailed record of all debt-related activities with searchable transaction history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Screenshot Section */}
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See DebtTracker in Action</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              A beautiful, intuitive interface designed to make debt management simple.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10 blur-3xl transform rotate-3"></div>
            <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl border border-gray-800">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="DebtTracker Dashboard" 
                className="w-full"
              />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute top-1/4 -left-4 md:-left-12 bg-gray-800 p-4 rounded-lg shadow-lg z-20 animate-float">
              <DollarSign size={24} className="text-green-400" />
            </div>
            <div className="absolute bottom-1/3 -right-4 md:-right-12 bg-gray-800 p-4 rounded-lg shadow-lg z-20 animate-float-delayed">
              <TrendingUp size={24} className="text-blue-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Thousands of users trust DebtTracker to manage their personal finances.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 relative">
              <div className="absolute -top-4 -left-4 bg-blue-600 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.13456 9H5.25C4.83579 9 4.5 9.33579 4.5 9.75V13.5C4.5 13.9142 4.83579 14.25 5.25 14.25H7.5C7.91421 14.25 8.25 14.5858 8.25 15V18C8.25 18.4142 8.58579 18.75 9 18.75H9.75C10.1642 18.75 10.5 18.4142 10.5 18V9.75C10.5 9.33579 10.1642 9 9.75 9H9.13456Z" fill="white"/>
                  <path d="M18.3846 9H14.5C14.0858 9 13.75 9.33579 13.75 9.75V13.5C13.75 13.9142 14.0858 14.25 14.5 14.25H16.75C17.1642 14.25 17.5 14.5858 17.5 15V18C17.5 18.4142 17.8358 18.75 18.25 18.75H19C19.4142 18.75 19.75 18.4142 19.75 18V9.75C19.75 9.33579 19.4142 9 19 9H18.3846Z" fill="white"/>
                </svg>
              </div>
              <div className="pt-6">
                <p className="text-gray-300 mb-6">
                  "DebtTracker has completely transformed how I manage my personal loans. The interest calculation feature alone has saved me countless hours of manual calculations."
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80" 
                    alt="Sarah Johnson" 
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h4 className="font-medium">Sarah Johnson</h4>
                    <p className="text-gray-400 text-sm">Small Business Owner</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 relative">
              <div className="absolute -top-4 -left-4 bg-blue-600 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.13456 9H5.25C4.83579 9 4.5 9.33579 4.5 9.75V13.5C4.5 13.9142 4.83579 14.25 5.25 14.25H7.5C7.91421 14.25 8.25 14.5858 8.25 15V18C8.25 18.4142 8.58579 18.75 9 18.75H9.75C10.1642 18.75 10.5 18.4142 10.5 18V9.75C10.5 9.33579 10.1642 9 9.75 9H9.13456Z" fill="white"/>
                  <path d="M18.3846 9H14.5C14.0858 9 13.75 9.33579 13.75 9.75V13.5C13.75 13.9142 14.0858 14.25 14.5 14.25H16.75C17.1642 14.25 17.5 14.5858 17.5 15V18C17.5 18.4142 17.8358 18.75 18.25 18.75H19C19.4142 18.75 19.75 18.4142 19.75 18V9.75C19.75 9.33579 19.4142 9 19 9H18.3846Z" fill="white"/>
                </svg>
              </div>
              <div className="pt-6">
                <p className="text-gray-300 mb-6">
                  "I used to lose track of who owed me money all the time. With DebtTracker, I have a clear picture of my finances and can easily follow up on outstanding debts."
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80" 
                    alt="Michael Chen" 
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h4 className="font-medium">Michael Chen</h4>
                    <p className="text-gray-400 text-sm">Freelance Designer</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 relative">
              <div className="absolute -top-4 -left-4 bg-blue-600 p-2 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.13456 9H5.25C4.83579 9 4.5 9.33579 4.5 9.75V13.5C4.5 13.9142 4.83579 14.25 5.25 14.25H7.5C7.91421 14.25 8.25 14.5858 8.25 15V18C8.25 18.4142 8.58579 18.75 9 18.75H9.75C10.1642 18.75 10.5 18.4142 10.5 18V9.75C10.5 9.33579 10.1642 9 9.75 9H9.13456Z" fill="white"/>
                  <path d="M18.3846 9H14.5C14.0858 9 13.75 9.33579 13.75 9.75V13.5C13.75 13.9142 14.0858 14.25 14.5 14.25H16.75C17.1642 14.25 17.5 14.5858 17.5 15V18C17.5 18.4142 17.8358 18.75 18.25 18.75H19C19.4142 18.75 19.75 18.4142 19.75 18V9.75C19.75 9.33579 19.4142 9 19 9H18.3846Z" fill="white"/>
                </svg>
              </div>
              <div className="pt-6">
                <p className="text-gray-300 mb-6">
                  "The dashboard gives me a perfect overview of my financial situation. I can see at a glance what I owe and what's owed to me. Absolutely essential tool!"
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80" 
                    alt="Emily Rodriguez" 
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h4 className="font-medium">Emily Rodriguez</h4>
                    <p className="text-gray-400 text-sm">Financial Analyst</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Choose the plan that works best for your needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <p className="text-gray-400 mb-4">For personal use</p>
                <div className="flex justify-center items-baseline">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Up to 10 contacts</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Basic debt tracking</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Simple dashboard</span>
                </li>
                <li className="flex items-center text-gray-500">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Advanced reporting</span>
                </li>
                <li className="flex items-center text-gray-500">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Data export</span>
                </li>
              </ul>
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
            
            {/* Pro Plan */}
            <div className="bg-gray-800 rounded-lg p-6 border border-blue-500 shadow-lg transform md:-translate-y-4 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-gray-400 mb-4">For power users</p>
                <div className="flex justify-center items-baseline">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Unlimited contacts</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Advanced debt tracking</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Detailed dashboard</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Basic reporting</span>
                </li>
                <li className="flex items-center text-gray-500">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Data export</span>
                </li>
              </ul>
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
            
            {/* Business Plan */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Business</h3>
                <p className="text-gray-400 mb-4">For teams & businesses</p>
                <div className="flex justify-center items-baseline">
                  <span className="text-4xl font-bold">$29.99</span>
                  <span className="text-gray-400 ml-1">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Unlimited contacts</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Advanced debt tracking</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Advanced dashboard</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Advanced reporting</span>
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-300">Data export</span>
                </li>
              </ul>
              <div className="text-center">
                <Link 
                  to="/login" 
                  className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Find answers to common questions about DebtTracker.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* FAQ Item 1 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">Is my financial data secure?</h3>
              <p className="text-gray-300">
                Yes, we take security very seriously. All your data is encrypted both in transit and at rest. We use industry-standard security measures to protect your information.
              </p>
            </div>
            
            {/* FAQ Item 2 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">Can I export my data?</h3>
              <p className="text-gray-300">
                Yes, Pro and Business plan users can export their data in various formats including CSV and PDF for record-keeping or analysis in other tools.
              </p>
            </div>
            
            {/* FAQ Item 3 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">How do I track interest payments?</h3>
              <p className="text-gray-300">
                DebtTracker allows you to set interest rates for each debt. The system will automatically calculate interest based on your specified rates and payment schedule.
              </p>
            </div>
            
            {/* FAQ Item 4 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">Can I use DebtTracker for business purposes?</h3>
              <p className="text-gray-300">
                Absolutely! Our Business plan is specifically designed for teams and businesses that need to track multiple debtors and creditors with advanced reporting features.
              </p>
            </div>
            
            {/* FAQ Item 5 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">Is there a mobile app available?</h3>
              <p className="text-gray-300">
                Currently, DebtTracker is available as a responsive web application that works well on mobile devices. A dedicated mobile app is on our roadmap for future development.
              </p>
            </div>
            
            {/* FAQ Item 6 */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-300">
                Yes, you can cancel your subscription at any time. Your account will remain active until the end of your current billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-8 md:mb-0 md:mr-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Take Control of Your Finances?</h2>
                <p className="text-blue-100 text-lg max-w-2xl">
                  Join thousands of users who are already managing their debts more effectively with DebtTracker.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/login" 
                  className="bg-white text-blue-600 hover:bg-gray-100 font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  Get Started <ArrowRight size={18} className="ml-2" />
                </Link>
                <a 
                  href="#features" 
                  className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 p-2 rounded-lg mr-2">
                  <DollarSign size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-white">DebtTracker</span>
              </div>
              <p className="text-gray-400 mb-4">
                The smart way to manage your personal debts and loans.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Roadmap</a></li>
                <li><a href="#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-medium mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} DebtTracker. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 3s ease-in-out 1.5s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
};

export default LandingPage;