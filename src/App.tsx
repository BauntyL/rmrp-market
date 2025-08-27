import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { HomePage } from './components/Pages/HomePage';
import { LoginPage } from './components/Pages/LoginPage';
import { RegisterPage } from './components/Pages/RegisterPage';
import { ListingsPage } from './components/Pages/ListingsPage';
import { ProfilePage } from './components/Pages/ProfilePage';
import { CreateListingPage } from './components/Pages/CreateListingPage';
import { ListingDetailPage } from './components/Pages/ListingDetailPage';
import { AdminPage } from './components/Pages/AdminPage';

// Simple router based on hash
function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.substring(1) || 'home';
    return hash.split('?')[0];
  });

  const navigate = (page: string) => {
    const pageName = page.split('?')[0];
    setCurrentPage(pageName);
    window.location.hash = page;
  };

  const renderPage = () => {
    const hash = window.location.hash.substring(1);
    const [pageName, ...pathParts] = hash.split('/');
    
    switch (pageName) {
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'listings':
        return <ListingsPage onNavigate={navigate} />;
      case 'profile':
        return <ProfilePage onNavigate={navigate} />;
      case 'create-listing':
        return <CreateListingPage onNavigate={navigate} />;
      case 'admin':
        return <AdminPage onNavigate={navigate} />;
      case 'listing':
        const listingId = pathParts[0];
        if (listingId) {
          return <ListingDetailPage listingId={listingId} onNavigate={navigate} />;
        }
        return <HomePage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  const [isReady, setIsReady] = useState(false);

  // Initialize app after mount
  React.useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null; // Or a loading spinner
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <AppProvider>
          <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
            <Header currentPage={currentPage} onNavigate={navigate} />
            <main>
              {renderPage()}
            </main>
            <Footer />
          </div>
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
