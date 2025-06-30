import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import ModeSelection from './pages/ModeSelection'
import TelemetryDashboard from './pages/TelemetryDashboard'
import SessionAnalysis from './pages/SessionAnalysis'
import VehicleSetup from './pages/VehicleSetup'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import AdvancedAIPage from './pages/AdvancedAI'
import AdvancedRacingAnalysis from './pages/AdvancedRacingAnalysis'
import AdvancedVisualization from './pages/AdvancedVisualization'
import CommercialPlatformPage from './pages/CommercialPlatform'
import DataManagement from './pages/DataManagement'
import DriftFeedback from './pages/DriftFeedback'
import HardwareConfiguration from './pages/HardwareConfiguration'
import HardwareIntegration from './pages/HardwareIntegration'
import HardwareTesting from './pages/HardwareTesting'
import RaceBoxIntegration from './pages/RaceBoxIntegration'
import MobileRacingPage from './pages/MobileRacing'
import RealRacingIntegration from './pages/RealRacingIntegration'
import TracksPage from './pages/Tracks'
import TrackCreator from './pages/TrackCreator'
import { SimpleThemeProvider } from './components/SimpleThemeProvider'
import { NotificationProvider } from './components/RacingNotifications'

// Loading spinner for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-racing-yellow" />
      <span className="ml-4 text-lg text-muted-foreground">Loading...</span>
    </div>
  );
}

// Error boundary for catching errors
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // You can log error here
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === 'development') console.error(error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong.</h1>
        <p className="text-muted-foreground mb-4">Please refresh the page or contact support.</p>
      </div>;
    }
    return this.props.children;
  }
}

// Debug component to log route changes
function RouteDebugger() {
  const location = useLocation();
  
  React.useEffect(() => {
    console.log('Route changed to:', location.pathname);
  }, [location.pathname]);
  
  return null;
}

const App = () => {
  return (
    <SimpleThemeProvider>
      <NotificationProvider>
        <ErrorBoundary>
          <Router>
            <RouteDebugger />
            <Layout>
              <React.Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/new-session" element={<ModeSelection />} />
                  <Route path="/mode-selection" element={<ModeSelection />} />
                  <Route path="/telemetry" element={<TelemetryDashboard />} />
                  <Route path="/session-analysis" element={<SessionAnalysis />} />
                  <Route path="/analysis" element={<SessionAnalysis />} />
                  <Route path="/vehicle-setup" element={<VehicleSetup />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/advanced-ai" element={<AdvancedAIPage />} />
                  <Route path="/advanced-racing-analysis" element={<AdvancedRacingAnalysis />} />
                  <Route path="/advanced-analysis" element={<AdvancedRacingAnalysis />} />
                  <Route path="/advanced-visualization" element={<AdvancedVisualization />} />
                  <Route path="/commercial-platform" element={<CommercialPlatformPage />} />
                  <Route path="/commercial" element={<CommercialPlatformPage />} />
                  <Route path="/data-management" element={<DataManagement />} />
                  <Route path="/drift-feedback" element={<DriftFeedback />} />
                  <Route path="/hardware-configuration" element={<HardwareConfiguration />} />
                  <Route path="/hardware-integration" element={<HardwareIntegration />} />
                  <Route path="/hardware" element={<HardwareIntegration />} />
                  <Route path="/hardware-testing" element={<HardwareTesting />} />
                  <Route path="/racebox-integration" element={<RaceBoxIntegration />} />
                  <Route path="/racebox" element={<RaceBoxIntegration />} />
                  <Route path="/mobile-racing" element={<MobileRacingPage />} />
                  <Route path="/real-racing-integration" element={<RealRacingIntegration />} />
                  <Route path="/tracks" element={<TracksPage />} />
                  <Route path="/track-creator" element={<TrackCreator />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </React.Suspense>
            </Layout>
          </Router>
        </ErrorBoundary>
      </NotificationProvider>
    </SimpleThemeProvider>
  )
}

export default App
