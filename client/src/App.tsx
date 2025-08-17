import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  const [, setLocation] = useLocation();
  const [showLanding, setShowLanding] = useState(true);

  const handleSignInClick = () => {
    setShowLanding(false);
    setLocation("/app");
  };

  if (showLanding) {
    return <LandingPage onSignInClick={handleSignInClick} />;
  }

  return (
    <Switch>
      <Route path="/app" component={Home} />
      <Route path="/landing" component={() => <LandingPage onSignInClick={handleSignInClick} />} />
      <Route path="/" component={() => <LandingPage onSignInClick={handleSignInClick} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
