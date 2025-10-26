import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Events from "./pages/Events";
import Marketplace from "./pages/Marketplace";
import Professionals from "./pages/Professionals";
import Resources from "./pages/Resources";
import Forum from "./pages/Forum";
import Admin from "./pages/Admin";
import Onboarding from "./pages/Onboarding";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Callback from "./pages/auth/Callback";
import VerifyEmail from "./pages/auth/VerifyEmail";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Switch>
          {/* Public routes */}
          <Route path={"/"} component={Home} />
          <Route path="/eventi" component={Events} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/professionisti" component={Professionals} />
          <Route path="/risorse" component={Resources} />
          <Route path="/forum" component={Forum} />
          
          {/* Auth routes */}
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/auth/forgot-password" component={ForgotPassword} />
          <Route path="/auth/reset-password" component={ResetPassword} />
          <Route path="/auth/callback" component={Callback} />
          <Route path="/auth/verify-email" component={VerifyEmail} />
          
          {/* Protected routes */}
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/profilo" component={Profile} />
          <Route path="/admin" component={Admin} />
          
          {/* 404 */}
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

