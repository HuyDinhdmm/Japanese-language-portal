
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Home, Book, Users, Brain, Clock, BarChart3, Sun, Moon, Download, Headphones } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Words', href: '/words', icon: Book },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Study', href: '/study', icon: Brain },
    { name: 'Sessions', href: '/sessions', icon: Clock },
    { name: 'Statistics', href: '/statistics', icon: BarChart3 },
    { name: 'Import', href: '/import', icon: Download },
    { name: 'YouTube Listening', href: '/youtube-listening', icon: Headphones },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const NavLink = ({ item, mobile = false }: { item: typeof navigation[0], mobile?: boolean }) => (
    <Link
      to={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50 group ${
        isActive(item.href) 
          ? 'bg-gradient-to-r from-blue-100 to-orange-100 text-blue-700 shadow-sm' 
          : 'text-gray-600 hover:text-gray-900'
      } ${mobile ? 'text-base' : ''}`}
    >
      <item.icon className={`${mobile ? 'h-5 w-5' : 'h-4 w-4'} transition-transform group-hover:scale-110`} />
      <span className="font-medium">{item.name}</span>
    </Link>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 ${darkMode ? 'dark' : ''}`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/80 backdrop-blur-sm px-6 py-4 shadow-lg border-r border-blue-100">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              日本語学習
            </h1>
          </div>
          <nav className="flex flex-1 flex-col space-y-2">
            {navigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>
          <div className="border-t border-gray-200 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="w-full justify-start gap-3 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-blue-100 bg-white/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex h-16 shrink-0 items-center border-b border-gray-200 pb-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                  日本語学習
                </h1>
              </div>
              <nav className="flex flex-1 flex-col space-y-2 pt-4">
                {navigation.map((item) => (
                  <NavLink key={item.name} item={item} mobile />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            日本語学習
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export { Layout };
