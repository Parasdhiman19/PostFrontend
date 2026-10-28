import './App.css';
import { ReactLenis } from 'lenis/react';
import { Route, Routes } from 'react-router';
import HomePage from './pages/HomePage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailsPage from './pages/PostDetailsPage';
import MainLayout from './layouts/MainLayout';
import SavedPostPage from './pages/SavedPostPage';
import InsightPage from './pages/InsightPage';
import CachePage from './pages/CachePage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <ReactLenis root options={{ lerp: 0.09, duration: 1.1, smoothWheel: true }}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/saved" element={<SavedPostPage />} />
        <Route
          path="/insight"
          element={
            <AdminRoute>
              <InsightPage />
            </AdminRoute>
          }
        />
        <Route path="/cache" element={<CachePage />} />
        <Route path="/details/:id" element={<PostDetailsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </ReactLenis>
  );
}

export default App;
