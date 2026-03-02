import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DailyCheckin from "./pages/DailyCheckin";
import CalendarView from "./pages/CalendarView";
import WeeklyReviews from "./pages/WeeklyReviews";
import WeeklyReviewDetail from "./pages/WeeklyReviewDetail";
import Exercise from "./pages/Exercise";
import MemphisBackground from "./components/MemphisBackground";
import WeeklyReviewReminder from "./components/WeeklyReviewReminder";
import { CheckCircle, Calendar, FileText, Dumbbell } from "lucide-react";

function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { path: "/", label: "打卡", icon: CheckCircle },
    { path: "/exercise", label: "锻炼", icon: Dumbbell },
    { path: "/calendar", label: "记录", icon: Calendar },
    { path: "/weekly-reviews", label: "周报", icon: FileText },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t-2 border-border safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map((tab) => {
          const isActive =
            location === tab.path ||
            (tab.path === "/weekly-reviews" && location.startsWith("/weekly-review")) ||
            (tab.path === "/exercise" && location.startsWith("/exercise"));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className={`text-[11px] font-bold ${isActive ? "tracking-wide" : ""}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b-2 border-border">
      <div className="container max-w-lg mx-auto py-3 flex items-center justify-center">
        <h1 className="text-lg font-black tracking-tight uppercase">
          Litch's Check
        </h1>
      </div>
    </header>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DailyCheckin} />
      <Route path="/exercise" component={Exercise} />
      <Route path="/calendar" component={CalendarView} />
      <Route path="/weekly-reviews" component={WeeklyReviews} />
      <Route path="/weekly-review/:weekStart" component={WeeklyReviewDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <MemphisBackground />
          <WeeklyReviewReminder />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <BottomNav />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
