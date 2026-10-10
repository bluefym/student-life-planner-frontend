import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  DollarSign,
  Download,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
  Pencil,
  CircleCheck,
  Circle,
} from "lucide-react";

import api from "./lib/api";
import AuthPage from "./components/auth/AuthPage";
import "./App.css";

const NAVIGATION = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Expenses", icon: Wallet },
  { label: "Habits", icon: Activity },
  { label: "Tasks", icon: CalendarDays },
  { label: "Notes", icon: NotebookPen },
  { label: "AI Assistant", icon: MessageCircle },
];

const EXPENSE_CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "EDUCATION",
  "ENTERTAINMENT",
  "SHOPPING",
  "HEALTH",
  "BILLS",
  "OTHER",
];

const CATEGORY_COLORS = {
  FOOD: "#e7a46b",
  TRANSPORT: "#8d9fe8",
  EDUCATION: "#78b7a2",
  ENTERTAINMENT: "#c5a0e6",
  SHOPPING: "#e28da0",
  HEALTH: "#84b9d4",
  BILLS: "#d5b96c",
  OTHER: "#a4a6b8",
};

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "No date";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCategory = (value) =>
  String(value || "OTHER")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong. Please try again.";

const unwrapPage = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export default function App() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("studentlife_token");
    const userText = localStorage.getItem("studentlife_user");

    if (!token || !userText) return null;

    try {
      return { token, user: JSON.parse(userText) };
    } catch {
      return null;
    }
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [activePage, setActivePage] = useState("Overview");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("dayform_theme") === "dark"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastVersion, setToastVersion] = useState(0);

  useEffect(() => {
    localStorage.setItem("dayform_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    setToastVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast, toastVersion]);

  const logout = useCallback(() => {
    localStorage.removeItem("studentlife_token");
    localStorage.removeItem("studentlife_user");
    setSession(null);
    setProfileOpen(false);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null);
      notify("Your session has expired. Please sign in again.", "error");
    };

    window.addEventListener("studentlife:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener(
        "studentlife:unauthorized",
        handleUnauthorized
      );
  }, [notify]);

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      const token = localStorage.getItem("studentlife_token");
      const userText = localStorage.getItem("studentlife_user");

      if (!token || !userText) {
        if (mounted) {
          setSession(null);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const response = await api.get("/api/auth/me");
        const savedUser = JSON.parse(userText);
        const user = { ...savedUser, ...response.data };

        if (mounted) {
          localStorage.setItem("studentlife_user", JSON.stringify(user));
          setSession({ token, user });
        }
      } catch {
        localStorage.removeItem("studentlife_token");
        localStorage.removeItem("studentlife_user");
        if (mounted) setSession(null);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    validateSession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthenticated = (authData) => {
    const token = authData?.token || localStorage.getItem("studentlife_token");
    const user =
      authData?.user ||
      JSON.parse(localStorage.getItem("studentlife_user") || "null");

    if (token && user) {
      localStorage.setItem("studentlife_token", token);
      localStorage.setItem("studentlife_user", JSON.stringify(user));
      setSession({ token, user });
      setActivePage("Overview");
    }
  };

  if (authLoading) {
    return (
      <div className="app-loading-screen">
        <div className="loading-brand-mark">
          <Command size={23} />
        </div>
        <div className="loading-spinner" />
        <p>Preparing your workspace...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  const user = session.user || {};
  const userName = user.name || user.fullName || user.email?.split("@")[0] || "Student";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const navigate = (page) => {
    setActivePage(page);
    setMobileOpen(false);
    setSearch("");
  };

  const commonProps = {
    search,
    notify,
    navigate,
  };

  return (
    <div className={`app-shell ${darkMode ? "theme-dark" : ""}`}>
      {mobileOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Command size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-name">dayform</div>
            <div className="brand-caption">YOUR PERSONAL SPACE</div>
          </div>
          <button
            className="icon-button sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {NAVIGATION.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "nav-item-active" : ""}`}
              onClick={() => navigate(label)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === "AI Assistant" && <span className="nav-ai-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-tip">
          <div className="tip-icon">
            <Sparkles size={18} />
          </div>
          <div className="tip-title">Small steps add up.</div>
          <p>Consistency beats intensity. Keep showing up for yourself.</p>
        </div>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${activePage === "Settings" ? "nav-item-active" : ""}`}
            onClick={() => navigate("Settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button
  className="nav-item sidebar-signout"
  onClick={logout}
>
  <LogOut size={18} />
  <span>Sign out</span>
</button>
          <div className="sidebar-user">
            <div className="avatar">{initials || "S"}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-email">{user.email || "Your account"}</div>
            </div>
            <button
              className="icon-button user-more"
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Open account menu"
            >
              <MoreHorizontal size={19} />
            </button>

            {profileOpen && (
              <div className="profile-popover">
                <div className="profile-popover-name">{userName}</div>
                <div className="profile-popover-email">{user.email}</div>
                <button className="profile-logout" onClick={logout}>
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="topbar-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search this page..."
                aria-label="Search this page"
              />
              <kbd>/</kbd>
            </label>
            <button
              className="icon-button theme-toggle"
              onClick={() => setDarkMode((value) => !value)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="topbar-avatar"
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Account menu"
            >
              {initials || "S"}
            </button>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Overview" && (
            <Overview
              {...commonProps}
              userName={userName}
              onNavigate={navigate}
            />
          )}
          {activePage === "Expenses" && <ExpensesPage {...commonProps} />}
          {activePage === "Habits" && <HabitsPage {...commonProps} />}
          {activePage === "Tasks" && <TasksPage {...commonProps} />}
          {activePage === "Notes" && <NotesPage {...commonProps} />}
          {activePage === "AI Assistant" && <AssistantPage {...commonProps} />}
          {activePage === "Settings" && (
  <SettingsPage
    user={user}
    userName={userName}
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    logout={logout}
    notify={notify}
  />
)}
        </div>

        <footer className="app-footer">
          <span>Made for a more intentional life.</span>
          <span className="footer-status">
            <span className="status-dot" />
            Connected to your workspace
          </span>
        </footer>
      </main>

      {toast && (
        <div
          key={toastVersion}
          className={`toast toast-${toast.type}`}
          role="status"
        >
          {toast.type === "error" ? (
            <CircleHelp size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel-heading">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Loading({ label = "Loading your data..." }) {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <span>{label}</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <CircleHelp size={21} />
      <p>{message}</p>
      {onRetry && (
        <button className="button button-secondary button-small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon = CircleCheck, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={22} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`form-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, subtitle, onClose, children, onSubmit, submitLabel = "Save changes" }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={19} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(event);
          }}
        >
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone = "lavender" }) {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
        <span className={`metric-icon metric-icon-${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

function Overview({ userName, notify, navigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/dashboard");
      setDashboard(response.data);
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const habits = dashboard?.habits || [];
  const tasks = dashboard?.upcomingTasks || [];
  const overdueTasks = dashboard?.overdueTasks || [];
  const spending = dashboard?.spending || {};
  const categories = spending.categoryTotals || [];
  const completedHabits = habits.filter((habit) => habit.completedToday).length;
  const totalHabitStreak = habits.reduce(
    (sum, habit) => sum + (Number(habit.currentStreak) || 0),
    0
  );
  const totalSpending = Number(spending.monthlyTotal) || 0;
  const maxCategoryAmount = Math.max(
    1,
    ...categories.map((item) => Number(item.amount) || 0)
  );

  const checkIn = async (habit) => {
    try {
      await api.post(`/api/habits/${habit.id}/check-ins`, { date: today() });
      notify(`${habit.name} marked complete.`);
      loadDashboard();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  const toggleTask = async (task) => {
    try {
      await api.patch(
        `/api/tasks/${task.id}/completion?completed=${!task.completed}`
      );
      notify(task.completed ? "Task reopened." : "Task completed.");
      loadDashboard();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  if (loading) {
    return (
      <>
        <PageHeading
          eyebrow="YOUR PERSONAL DASHBOARD"
          title={`${getGreeting()}, ${userName.split(" ")[0]}.`}
          description="A little clarity goes a long way. Here's where things stand today."
        />
        <Loading />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeading
          eyebrow="YOUR PERSONAL DASHBOARD"
          title={`${getGreeting()}, ${userName.split(" ")[0]}.`}
          description="A little clarity goes a long way. Here's where things stand today."
        />
        <ErrorState message={error} onRetry={loadDashboard} />
      </>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL DASHBOARD"
        title={`${getGreeting()}, ${userName.split(" ")[0]}.`}
        description="A little clarity goes a long way. Here's where things stand today."
        action={
          <div className="date-chip">
            <CalendarDays size={16} />
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </div>
        }
      />

      <section className="welcome-banner">
        <div className="welcome-banner-content">
          <div className="welcome-kicker">
            <Sparkles size={15} />
            YOUR DAY, IN PERSPECTIVE
          </div>
          <h2>Make room for what matters.</h2>
          <p>
            Progress isn't about doing everything. It's about doing the right
            things, one day at a time.
          </p>
          <button
            className="banner-link"
            onClick={() => navigate("Tasks")}
          >
            Review your priorities <ArrowRight size={16} />
          </button>
        </div>
        <div className="banner-decoration" aria-hidden="true">
          <div className="banner-orbit orbit-one" />
          <div className="banner-orbit orbit-two" />
          <div className="banner-orbit orbit-three" />
          <div className="banner-orbit-center">
            <Target size={31} />
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          label="Spent this month"
          value={formatINR(totalSpending)}
          detail="Across all expense categories"
          icon={Wallet}
          tone="peach"
        />
        <MetricCard
          label="Habits completed"
          value={`${completedHabits}/${habits.length}`}
          detail={habits.length ? "Today's habit check-in" : "Add your first habit"}
          icon={Activity}
          tone="mint"
        />
        <MetricCard
          label="Upcoming tasks"
          value={tasks.length}
          detail={
            overdueTasks.length
              ? `${overdueTasks.length} overdue`
              : "You're keeping track"
          }
          icon={CalendarDays}
          tone="lavender"
        />
        <MetricCard
          label="Habit streaks"
          value={totalHabitStreak}
          detail="Combined current streak days"
          icon={Flame}
          tone="blue"
        />
      </div>

      <div className="overview-grid">
        <Panel
          title="Spending breakdown"
          subtitle="Where your money went this month"
          className="spending-panel"
          action={
            <button
              className="text-button"
              onClick={() => navigate("Expenses")}
            >
              View all <ArrowRight size={14} />
            </button>
          }
        >
          {categories.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No expenses yet"
              description="Start tracking your spending to see your breakdown here."
              action={
                <button
                  className="button button-secondary button-small"
                  onClick={() => navigate("Expenses")}
                >
                  Add an expense
                </button>
              }
            />
          ) : (
            <div className="category-list">
              {categories
                .slice()
                .sort((a, b) => Number(b.amount) - Number(a.amount))
                .slice(0, 6)
                .map((item) => {
                  const color =
                    CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER;
                  const amount = Number(item.amount) || 0;
                  const percentage = Math.round((amount / maxCategoryAmount) * 100);
                  return (
                    <div className="category-row" key={item.category}>
                      <div className="category-row-top">
                        <div className="category-name-wrap">
                          <span
                            className="category-dot"
                            style={{ backgroundColor: color }}
                          />
                          <span className="category-name">
                            {formatCategory(item.category)}
                          </span>
                        </div>
                        <strong>{formatINR(amount)}</strong>
                      </div>
                      <div className="category-track">
                        <div
                          className="category-fill"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Panel>

        <Panel
          title="Today's habits"
          subtitle="Build the routine you want"
          className="habits-panel"
          action={
            <button
              className="text-button"
              onClick={() => navigate("Habits")}
            >
              Manage <ArrowRight size={14} />
            </button>
          }
        >
          {habits.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Start with one habit"
              description="Small, repeatable actions make a difference."
              action={
                <button
                  className="button button-secondary button-small"
                  onClick={() => navigate("Habits")}
                >
                  Create a habit
                </button>
              }
            />
          ) : (
            <div className="overview-habit-list">
              {habits.slice(0, 5).map((habit) => (
                <div className="overview-habit" key={habit.id}>
                  <button
                    className={`habit-check ${habit.completedToday ? "habit-check-done" : ""}`}
                    onClick={() => !habit.completedToday && checkIn(habit)}
                    disabled={habit.completedToday}
                    aria-label={`Mark ${habit.name} complete`}
                  >
                    {habit.completedToday && <Check size={15} />}
                  </button>
                  <div className="overview-habit-text">
                    <span className={habit.completedToday ? "habit-completed-text" : ""}>
                      {habit.name}
                    </span>
                    <small>
                      <Flame size={12} /> {habit.currentStreak || 0} day streak
                    </small>
                  </div>
                  {habit.completedToday && (
                    <span className="done-label">Done</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Upcoming tasks"
          subtitle="Keep the important things moving"
          className="tasks-panel"
          action={
            <button
              className="text-button"
              onClick={() => navigate("Tasks")}
            >
              All tasks <ArrowRight size={14} />
            </button>
          }
        >
          {tasks.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing on the list"
              description="Add a task when something needs your attention."
              action={
                <button
                  className="button button-secondary button-small"
                  onClick={() => navigate("Tasks")}
                >
                  Add a task
                </button>
              }
            />
          ) : (
            <div className="overview-task-list">
              {tasks.slice(0, 5).map((task) => (
                <div className="overview-task" key={task.id}>
                  <button
                    className={`task-check ${task.completed ? "task-check-done" : ""}`}
                    onClick={() => toggleTask(task)}
                    aria-label={task.completed ? "Reopen task" : "Complete task"}
                  >
                    {task.completed && <Check size={14} />}
                  </button>
                  <div className="overview-task-text">
                    <span className={task.completed ? "task-completed-text" : ""}>
                      {task.title}
                    </span>
                    <small>
                      <Clock3 size={12} /> {formatDate(task.dueDate)}
                    </small>
                  </div>
                  {task.overdue && !task.completed && (
                    <span className="overdue-label">Overdue</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <section className="assistant-promo">
          <div className="assistant-promo-top">
            <div className="assistant-promo-icon">
              <Sparkles size={21} />
            </div>
            <span className="ai-label">AI POWERED</span>
          </div>
          <h2>A little help, when you need it.</h2>
          <p>
            Think through your priorities, get study ideas, or make a plan for
            the week with your personal assistant.
          </p>
          <button
            className="button button-dark"
            onClick={() => navigate("AI Assistant")}
          >
            Talk to your assistant <ArrowRight size={16} />
          </button>
          <div className="assistant-promo-decoration" aria-hidden="true">
            <div />
            <div />
            <div />
          </div>
        </section>
      </div>
    </>
  );
}

function ExpensesPage({ search, notify }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [form, setForm] = useState({
    amount: "",
    category: "FOOD",
    description: "",
    expenseDate: today(),
  });

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/expenses", {
        params: { page: 0, size: 100, sortBy: "expenseDate", direction: "DESC" },
      });
      setExpenses(unwrapPage(response.data));
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      amount: "",
      category: "FOOD",
      description: "",
      expenseDate: today(),
    });
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setForm({
      amount: String(expense.amount ?? ""),
      category: expense.category || "OTHER",
      description: expense.description || "",
      expenseDate: String(expense.expenseDate || today()).slice(0, 10),
    });
    setModalOpen(true);
  };

  const saveExpense = async () => {
    if (!form.amount || Number(form.amount) <= 0 || !form.expenseDate) {
      notify("Enter a valid amount and date.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        amount: Number(form.amount),
        category: form.category,
        description: form.description.trim(),
        expenseDate: form.expenseDate,
      };

      if (editing) {
        await api.put(`/api/expenses/${editing.id}`, payload);
        notify("Expense updated.");
      } else {
        await api.post("/api/expenses", payload);
        notify("Expense added.");
      }

      setModalOpen(false);
      await loadExpenses();
    } catch (requestError) {
      notify(getError(requestError), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (expense) => {
    if (!window.confirm(`Delete this expense${expense.description ? `: ${expense.description}` : ""}?`)) {
      return;
    }
    try {
      await api.delete(`/api/expenses/${expense.id}`);
      notify("Expense deleted.");
      loadExpenses();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  const filteredExpenses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return expenses.filter((expense) => {
      const date = String(expense.expenseDate || "");
      const matchesMonth =
        date.slice(0, 4) === year &&
        String(Number(date.slice(5, 7))) === String(Number(month));
      const matchesSearch =
        !term ||
        String(expense.description || "").toLowerCase().includes(term) ||
        formatCategory(expense.category).toLowerCase().includes(term);
      return matchesMonth && matchesSearch;
    });
  }, [expenses, search, month, year]);

  const monthlyTotal = filteredExpenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0
  );

  const exportCSV = () => {
    const rows = [
      ["Date", "Category", "Description", "Amount"],
      ...filteredExpenses.map((expense) => [
        expense.expenseDate || "",
        expense.category || "",
        expense.description || "",
        expense.amount ?? 0,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `student-life-expenses-${year}-${month.padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeading
        eyebrow="MONEY MANAGEMENT"
        title="Expenses"
        description="Know where your money goes. Make intentional decisions with it."
        action={
          <button className="button button-primary" onClick={openCreate}>
            <Plus size={17} /> Add expense
          </button>
        }
      />

      <div className="filter-toolbar">
        <div className="filter-month">
          <CalendarDays size={16} />
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={String(index + 1)}>
                {new Date(2000, index, 1).toLocaleDateString("en-IN", { month: "long" })}
              </option>
            ))}
          </select>
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            {Array.from({ length: 6 }, (_, index) => {
              const value = String(new Date().getFullYear() - index);
              return <option key={value} value={value}>{value}</option>;
            })}
          </select>
        </div>
        <button className="button button-secondary" onClick={exportCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="metric-grid expense-metrics">
        <MetricCard
          label="Total this month"
          value={formatINR(monthlyTotal)}
          detail={`${filteredExpenses.length} recorded expenses`}
          icon={Wallet}
          tone="peach"
        />
        <MetricCard
          label="Average expense"
          value={formatINR(filteredExpenses.length ? monthlyTotal / filteredExpenses.length : 0)}
          detail="Per recorded transaction"
          icon={TrendingUp}
          tone="mint"
        />
        <MetricCard
          label="Categories used"
          value={new Set(filteredExpenses.map((item) => item.category)).size}
          detail="Different spending categories"
          icon={BookOpen}
          tone="lavender"
        />
      </div>

      <Panel
        title="Expense history"
        subtitle="Your recorded transactions"
        className="data-panel"
      >
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={loadExpenses} />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No expenses found"
            description="Add an expense or change the selected month."
            action={
              <button className="button button-primary button-small" onClick={openCreate}>
                <Plus size={15} /> Add an expense
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="align-right">Amount</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <div className="table-primary-text">
                        {expense.description || formatCategory(expense.category)}
                      </div>
                      <div className="table-secondary-text">#{expense.id}</div>
                    </td>
                    <td>
                      <span className="category-pill">
                        <span
                          className="category-dot"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.OTHER,
                          }}
                        />
                        {formatCategory(expense.category)}
                      </span>
                    </td>
                    <td>{formatDate(expense.expenseDate)}</td>
                    <td className="align-right table-amount">
                      {formatINR(expense.amount)}
                    </td>
                    <td className="align-right">
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          onClick={() => openEdit(expense)}
                          aria-label="Edit expense"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button danger-icon"
                          onClick={() => deleteExpense(expense)}
                          aria-label="Delete expense"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {modalOpen && (
        <Modal
          title={editing ? "Edit expense" : "Add an expense"}
          subtitle="Record the details of your transaction."
          onClose={() => setModalOpen(false)}
          onSubmit={saveExpense}
          submitLabel={saving ? "Saving..." : editing ? "Save changes" : "Add expense"}
        >
          <div className="form-grid">
            <Field label="Amount (₹)">
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="e.g. 250"
              />
            </Field>
            <Field label="Category">
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {formatCategory(category)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                required
                value={form.expenseDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, expenseDate: event.target.value }))
                }
              />
            </Field>
            <Field label="Description">
              <input
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="What was this expense for?"
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}

function HabitsPage({ search, notify }) {
  const [habits, setHabits] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", active: true });

  const loadHabits = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/habits");
      const list = Array.isArray(response.data) ? response.data : [];
      setHabits(list);

      const results = await Promise.allSettled(
        list.map((habit) =>
          api.get(`/api/habits/${habit.id}/streak`).then((result) => ({
            id: habit.id,
            data: result.data,
          }))
        )
      );

      const nextStreaks = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          nextStreaks[result.value.id] = result.value.data;
        }
      });
      setStreaks(nextStreaks);
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", active: true });
    setModalOpen(true);
  };

  const openEdit = (habit) => {
    setEditing(habit);
    setForm({
      name: habit.name || "",
      description: habit.description || "",
      active: habit.active !== false,
    });
    setModalOpen(true);
  };

  const saveHabit = async () => {
    if (!form.name.trim()) {
      notify("Enter a name for your habit.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        active: Boolean(form.active),
      };
      if (editing) {
        await api.put(`/api/habits/${editing.id}`, payload);
        notify("Habit updated.");
      } else {
        await api.post("/api/habits", payload);
        notify("Habit created.");
      }
      setModalOpen(false);
      await loadHabits();
    } catch (requestError) {
      notify(getError(requestError), "error");
    } finally {
      setSaving(false);
    }
  };

  const checkIn = async (habit) => {
    try {
      await api.post(`/api/habits/${habit.id}/check-ins`, { date: today() });
      notify(`${habit.name} checked in.`);
      loadHabits();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  const toggleActive = async (habit) => {
    try {
      await api.patch(
        `/api/habits/${habit.id}/active?active=${!habit.active}`
      );
      notify(habit.active ? "Habit paused." : "Habit reactivated.");
      loadHabits();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  const deleteHabit = async (habit) => {
    if (!window.confirm(`Delete the habit "${habit.name}"?`)) return;
    try {
      await api.delete(`/api/habits/${habit.id}`);
      notify("Habit deleted.");
      loadHabits();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  const filteredHabits = habits.filter((habit) => {
    const term = search.toLowerCase().trim();
    return (
      !term ||
      habit.name?.toLowerCase().includes(term) ||
      habit.description?.toLowerCase().includes(term)
    );
  });

  const activeHabits = habits.filter((habit) => habit.active !== false);
  const totalStreak = activeHabits.reduce(
    (sum, habit) => sum + (Number(streaks[habit.id]?.currentStreak) || 0),
    0
  );

  return (
    <>
      <PageHeading
        eyebrow="DAILY ROUTINES"
        title="Habits"
        description="Make the small things automatic. Consistency is built one check-in at a time."
        action={
          <button className="button button-primary" onClick={openCreate}>
            <Plus size={17} /> New habit
          </button>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Total habits"
          value={habits.length}
          detail="All your routines"
          icon={Activity}
          tone="lavender"
        />
        <MetricCard
          label="Active habits"
          value={activeHabits.length}
          detail="Routines currently in use"
          icon={CheckCircle2}
          tone="mint"
        />
        <MetricCard
          label="Combined streak"
          value={`${totalStreak} days`}
          detail="Sum of current habit streaks"
          icon={Flame}
          tone="peach"
        />
      </div>

      <div className="section-heading-inline">
        <div>
          <h2>Your routines</h2>
          <p>Track your progress and keep your streak alive.</p>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={loadHabits} />
      ) : filteredHabits.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Activity}
            title="Your habit list starts here"
            description="Create a habit for something you want to do consistently."
            action={
              <button className="button button-primary" onClick={openCreate}>
                <Plus size={16} /> Create your first habit
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="entity-grid">
          {filteredHabits.map((habit, index) => {
            const streak = streaks[habit.id] || {};
            return (
              <article className="entity-card habit-card" key={habit.id}>
                <div className="entity-card-top">
                  <div className={`entity-icon entity-icon-${index % 4}`}>
                    <Activity size={21} />
                  </div>
                  <div className="entity-card-actions">
                    <button
                      className="icon-button"
                      onClick={() => openEdit(habit)}
                      aria-label="Edit habit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => toggleActive(habit)}
                      title={habit.active ? "Pause habit" : "Activate habit"}
                      aria-label={habit.active ? "Pause habit" : "Activate habit"}
                    >
                      {habit.active ? <Moon size={15} /> : <CircleCheck size={15} />}
                    </button>
                    <button
                      className="icon-button danger-icon"
                      onClick={() => deleteHabit(habit)}
                      aria-label="Delete habit"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="entity-title-row">
                  <h3>{habit.name}</h3>
                  <span className={`status-pill ${habit.active ? "status-active" : "status-paused"}`}>
                    {habit.active ? "Active" : "Paused"}
                  </span>
                </div>
                <p className="entity-description">
                  {habit.description || "A small step toward a more consistent routine."}
                </p>
                <div className="habit-stats">
                  <div className="habit-stat">
                    <Flame size={16} />
                    <div>
                      <strong>{streak.currentStreak ?? 0}</strong>
                      <span>Current streak</span>
                    </div>
                  </div>
                  <div className="habit-stat">
                    <TrendingUp size={16} />
                    <div>
                      <strong>{streak.longestStreak ?? 0}</strong>
                      <span>Best streak</span>
                    </div>
                  </div>
                </div>
                <button
                  className="button button-secondary habit-checkin-button"
                  onClick={() => checkIn(habit)}
                  disabled={habit.active === false}
                >
                  <CheckCircle2 size={16} />
                  Check in for today
                </button>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Edit habit" : "Create a habit"}
          subtitle="Choose a routine you want to make part of your day."
          onClose={() => setModalOpen(false)}
          onSubmit={saveHabit}
          submitLabel={saving ? "Saving..." : editing ? "Save changes" : "Create habit"}
        >
          <div className="form-grid">
            <Field label="Habit name">
              <input
                required
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="e.g. Read for 20 minutes"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="What does this habit mean to you?"
              />
            </Field>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, active: event.target.checked }))
                }
              />
              <span>Keep this habit active</span>
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}

function TasksPage({ search, notify }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: today(),
    completed: false,
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/tasks");
      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", dueDate: today(), completed: false });
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: String(task.dueDate || today()).slice(0, 10),
      completed: Boolean(task.completed),
    });
    setModalOpen(true);
  };

  const saveTask = async () => {
    if (!form.title.trim()) {
      notify("Enter a task title.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || null,
        completed: Boolean(form.completed),
      };
      if (editing) {
        await api.put(`/api/tasks/${editing.id}`, payload);
        notify("Task updated.");
      } else {
        await api.post("/api/tasks", payload);
        notify("Task created.");
      }
      setModalOpen(false);
      loadTasks();
    } catch (requestError) {
      notify(getError(requestError), "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleCompletion = async (task) => {
    try {
      await api.patch(
        `/api/tasks/${task.id}/completion?completed=${!task.completed}`
      );
      notify(task.completed ? "Task reopened." : "Task completed.");
      loadTasks();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/api/tasks/${task.id}`);
      notify("Task deleted.");
      loadTasks();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      task.title?.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term);
    const matchesFilter =
      filter === "all" ||
      (filter === "open" && !task.completed) ||
      (filter === "completed" && task.completed) ||
      (filter === "overdue" && task.overdue && !task.completed);
    return matchesSearch && matchesFilter;
  });

  const openCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.filter((task) => task.completed).length;
  const overdueCount = tasks.filter((task) => task.overdue && !task.completed).length;

  return (
    <>
      <PageHeading
        eyebrow="FOCUS & EXECUTION"
        title="Tasks"
        description="Turn your plans into manageable steps. Start with what matters most."
        action={
          <button className="button button-primary" onClick={openCreate}>
            <Plus size={17} /> Add task
          </button>
        }
      />

      <div className="metric-grid">
        <MetricCard
          label="Open tasks"
          value={openCount}
          detail="Still on your list"
          icon={Circle}
          tone="lavender"
        />
        <MetricCard
          label="Completed"
          value={completedCount}
          detail="Tasks you've finished"
          icon={CheckCircle2}
          tone="mint"
        />
        <MetricCard
          label="Overdue"
          value={overdueCount}
          detail="Need a little attention"
          icon={Clock3}
          tone="peach"
        />
      </div>

      <Panel
        title="Your task list"
        subtitle={`${filteredTasks.length} task${filteredTasks.length === 1 ? "" : "s"} shown`}
        className="data-panel"
        action={
          <div className="filter-select-wrap">
            <ChevronDown size={14} />
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All tasks</option>
              <option value="open">Open</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={loadTasks} />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No tasks to show"
            description="Add a task or change your filters to see other tasks."
            action={
              <button className="button button-primary button-small" onClick={openCreate}>
                <Plus size={15} /> Add a task
              </button>
            }
          />
        ) : (
          <div className="task-page-list">
            {filteredTasks
              .slice()
              .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return String(a.dueDate || "9999").localeCompare(String(b.dueDate || "9999"));
              })
              .map((task) => (
                <article className={`task-page-item ${task.completed ? "task-page-item-complete" : ""}`} key={task.id}>
                  <button
                    className={`task-check large-task-check ${task.completed ? "task-check-done" : ""}`}
                    onClick={() => toggleCompletion(task)}
                    aria-label={task.completed ? "Reopen task" : "Complete task"}
                  >
                    {task.completed && <Check size={15} />}
                  </button>
                  <div className="task-page-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <span><CalendarDays size={13} /> {formatDate(task.dueDate)}</span>
                      {task.overdue && !task.completed && (
                        <span className="overdue-label">Overdue</span>
                      )}
                      {task.completed && <span className="status-pill status-active">Completed</span>}
                    </div>
                  </div>
                  <div className="task-page-actions">
                    <button className="icon-button" onClick={() => openEdit(task)} aria-label="Edit task">
                      <Pencil size={15} />
                    </button>
                    <button className="icon-button danger-icon" onClick={() => deleteTask(task)} aria-label="Delete task">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        )}
      </Panel>

      {modalOpen && (
        <Modal
          title={editing ? "Edit task" : "Create a task"}
          subtitle="Be specific about what needs to get done."
          onClose={() => setModalOpen(false)}
          onSubmit={saveTask}
          submitLabel={saving ? "Saving..." : editing ? "Save changes" : "Create task"}
        >
          <div className="form-grid">
            <Field label="Task title">
              <input
                required
                maxLength={150}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="e.g. Finish database assignment"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                maxLength={1000}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Add a few details (optional)"
              />
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueDate: event.target.value }))
                }
              />
            </Field>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.completed}
                onChange={(event) =>
                  setForm((current) => ({ ...current, completed: event.target.checked }))
                }
              />
              <span>Mark this task as completed</span>
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}

function NotesPage({ search, notify }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/notes");
      setNotes(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(getError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", content: "" });
    setModalOpen(true);
  };

  const openEdit = (note) => {
    setEditing(note);
    setForm({ title: note.title || "", content: note.content || "" });
    setModalOpen(true);
  };

  const saveNote = async () => {
    if (!form.title.trim()) {
      notify("Give your note a title.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content,
      };
      if (editing) {
        await api.put(`/api/notes/${editing.id}`, payload);
        notify("Note updated.");
      } else {
        await api.post("/api/notes", payload);
        notify("Note saved.");
      }
      setModalOpen(false);
      loadNotes();
    } catch (requestError) {
      notify(getError(requestError), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (note) => {
    if (!window.confirm(`Delete the note "${note.title}"?`)) return;
    try {
      await api.delete(`/api/notes/${note.id}`);
      notify("Note deleted.");
      loadNotes();
    } catch (requestError) {
      notify(getError(requestError), "error");
    }
  };

  const filteredNotes = notes.filter((note) => {
    const term = search.trim().toLowerCase();
    return (
      !term ||
      note.title?.toLowerCase().includes(term) ||
      note.content?.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <PageHeading
        eyebrow="THOUGHTS & IDEAS"
        title="Notes"
        description="A place for your thoughts, plans, reminders, and ideas worth keeping."
        action={
          <button className="button button-primary" onClick={openCreate}>
            <Plus size={17} /> New note
          </button>
        }
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={loadNotes} />
      ) : filteredNotes.length === 0 ? (
        <Panel>
          <EmptyState
            icon={NotebookPen}
            title="A blank page"
            description="Capture an idea before it slips away. Your notes stay in your workspace."
            action={
              <button className="button button-primary" onClick={openCreate}>
                <Plus size={16} /> Write your first note
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note, index) => (
            <article className={`note-card note-card-${index % 4}`} key={note.id}>
              <div className="note-card-top">
                <div className="note-card-symbol">
                  <NotebookPen size={17} />
                </div>
                <div className="note-actions">
                  <button className="icon-button" onClick={() => openEdit(note)} aria-label="Edit note">
                    <Pencil size={15} />
                  </button>
                  <button className="icon-button danger-icon" onClick={() => deleteNote(note)} aria-label="Delete note">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3>{note.title}</h3>
              <p className="note-preview">{note.content || "No content yet."}</p>
              <div className="note-card-footer">
                <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                <span className="note-read-more">Open note <ArrowRight size={13} /></span>
              </div>
              <button
                className="note-card-open"
                onClick={() => openEdit(note)}
                aria-label={`Open ${note.title}`}
              />
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Edit note" : "New note"}
          subtitle="Write it down. You can always refine it later."
          onClose={() => setModalOpen(false)}
          onSubmit={saveNote}
          submitLabel={saving ? "Saving..." : editing ? "Save changes" : "Save note"}
        >
          <div className="form-grid">
            <Field label="Title">
              <input
                required
                maxLength={150}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Give this note a title"
              />
            </Field>
            <Field label="Content">
              <textarea
                rows={9}
                maxLength={10000}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({ ...current, content: event.target.value }))
                }
                placeholder="Start writing..."
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}

function AssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi. I'm your Student Life Assistant. I can help you plan your studies, think through your priorities, build routines, or organise your week. What would you like to work on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const suggestions = [
    "Help me plan my week",
    "Create a study routine",
    "How can I build better habits?",
    "Help me manage my expenses",
  ];

  const sendMessage = async (messageText = input) => {
    const message = messageText.trim();
    if (!message || sending) return;
    if (message.length > 2000) {
      setError("Keep your message under 2,000 characters.");
      return;
    }

    setError("");
    setInput("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setSending(true);

    try {
      const response = await api.post("/api/chat", { message });
      const reply =
        response.data?.reply ||
        "I received your message, but there wasn't a response to display.";
      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (requestError) {
      const message = getError(requestError);
      setError(message);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I couldn't reach the assistant service just now. Please check that your backend is running and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL COPILOT"
        title="AI Assistant"
        description="A thinking partner for planning, studying, and making everyday decisions."
      />

      <section className="chat-layout">
        <div className="chat-main panel">
          <div className="chat-header">
            <div className="chat-avatar">
              <Sparkles size={20} />
            </div>
            <div>
              <h2>Dayform Assistant</h2>
              <p><span className="status-dot" /> Ready to help</p>
            </div>
            <div className="chat-header-tag">AI</div>
          </div>

          <div className="chat-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-message-row ${message.role === "user" ? "chat-message-row-user" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="chat-message-avatar">
                    <Sparkles size={15} />
                  </div>
                )}
                <div className={`chat-bubble chat-bubble-${message.role}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="chat-message-row">
                <div className="chat-message-avatar">
                  <Sparkles size={15} />
                </div>
                <div className="chat-bubble chat-bubble-assistant typing-bubble">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          {error && <div className="chat-error">{error}</div>}

          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              rows={1}
              maxLength={2000}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask something, or think out loud..."
              disabled={sending}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              className="chat-send-button"
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </form>
          <div className="chat-disclaimer">
            AI can make mistakes. Check important information before acting on it.
          </div>
        </div>

        <aside className="chat-sidebar">
          <Panel title="Try asking" subtitle="A few places to start">
            <div className="suggestion-list">
              {suggestions.map((suggestion) => (
                <button
                  className="suggestion-button"
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={sending}
                >
                  <span>{suggestion}</span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          </Panel>

          <div className="chat-guidance">
            <div className="chat-guidance-icon"><ShieldCheck size={19} /></div>
            <h3>Make it your own</h3>
            <p>
              Share the context that matters, ask follow-up questions, and
              adjust the plan until it fits your real schedule.
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}


function SettingsPage({ user, userName, darkMode, setDarkMode, logout, notify }) {
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("dayform_notifications") !== "false"
  );

  function updateNotifications(enabled) {
    setNotifications(enabled);
    localStorage.setItem("dayform_notifications", String(enabled));
    notify("Notification preference saved.");
  }

  return (
    <>
      <PageHeading
        eyebrow="PERSONALIZE YOUR WORKSPACE"
        title="Settings"
        description="Make Dayform work the way you prefer."
      />

      <Panel
        title="Account"
        subtitle="Your signed-in account information"
        className="settings-section"
      >
        <div className="settings-account">
          <div className="avatar">
            {(userName || "S")
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0].toUpperCase())
              .join("")}
          </div>

          <div>
            <div className="settings-option-title">{userName}</div>
            <div className="settings-value">{user?.email || "No email available"}</div>
            {user?.role && (
              <div className="settings-value">Role: {user.role}</div>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title="Appearance"
        subtitle="Choose how your workspace looks"
        className="settings-section"
      >
        <div className="settings-option">
          <div>
            <div className="settings-option-title">Color theme</div>
            <div className="settings-option-description">
              Switch between light and dark appearance.
            </div>
          </div>

          <div className="settings-theme-options">
            <button
              type="button"
              className={`button ${!darkMode ? "button-primary" : "button-secondary"}`}
              onClick={() => setDarkMode(false)}
              aria-pressed={!darkMode}
            >
              <Sun size={15} /> Light
            </button>

            <button
              type="button"
              className={`button ${darkMode ? "button-primary" : "button-secondary"}`}
              onClick={() => setDarkMode(true)}
              aria-pressed={darkMode}
            >
              <Moon size={15} /> Dark
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Preferences"
        subtitle="Manage your personal workspace preferences"
        className="settings-section"
      >
        <div className="settings-option">
          <div>
            <div className="settings-option-title">Notifications preference</div>
            <div className="settings-option-description">
              Save your preference for receiving notifications in the interface.
              This does not configure email or push notifications.
            </div>
          </div>

          <input
            type="checkbox"
            checked={notifications}
            onChange={(event) => updateNotifications(event.target.checked)}
            aria-label="Enable notifications preference"
          />
        </div>
      </Panel>

      <Panel
        title="Security"
        subtitle="Manage your current session"
        className="settings-section"
      >
        <div className="settings-option">
          <div>
            <div className="settings-option-title">Sign out of Dayform</div>
            <div className="settings-option-description">
              End this session on the current browser.
            </div>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={logout}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </Panel>
    </>
  );
}
