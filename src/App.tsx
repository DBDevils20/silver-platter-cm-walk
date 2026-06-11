import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useWalkStore } from './store/walkStore';
import { useAuthStore } from './store/authStore';
import { BottomNav } from './components/BottomNav';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { ChecklistScreen } from './screens/ChecklistScreen';
import { MeasurementsScreen } from './screens/MeasurementsScreen';
import { UtilitiesScreen } from './screens/UtilitiesScreen';
import { DocumentsScreen } from './screens/DocumentsScreen';
import { SignOffScreen } from './screens/SignOffScreen';

function WalkLayout() {
  const activeWalkId = useWalkStore((s) => s.activeWalkId);
  if (!activeWalkId) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen bg-deck">
      <Outlet />
      <BottomNav />
    </div>
  );
}

export default function App() {
  const load = useWalkStore((s) => s.load);
  const loaded = useWalkStore((s) => s.loaded);
  const currentUser = useAuthStore((s) => s.currentUser);

  useEffect(() => {
    void load();
  }, [load]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="eyebrow">Silver Platter · Loading</span>
      </div>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/setup" element={<SetupScreen />} />
        <Route path="/walk" element={<WalkLayout />}>
          <Route path="checklist" element={<ChecklistScreen />} />
          <Route path="measures" element={<MeasurementsScreen />} />
          <Route path="utilities" element={<UtilitiesScreen />} />
          <Route path="docs" element={<DocumentsScreen />} />
          <Route path="signoff" element={<SignOffScreen />} />
          <Route index element={<Navigate to="checklist" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
