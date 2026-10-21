
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import AuthScreen from "./AuthScreen";
import { api, type User } from "./api";
import "./App.css";

type Task = {
  id: number;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState("Overview");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function loadTasks() {
    setLoading(true);

    try {
      setError("");
      const data = await api<Task[]>("/tasks/");
      setTasks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Неизвестная ошибка";

      setError(`Не удалось загрузить задачи: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const currentUser = await api<User>("/auth/me");

        if (!active) return;

        setUser(currentUser);
        await loadTasks();
      } catch {
        if (active) {
          setUser(null);
          setTasks([]);
          setLoading(false);
        }
      } finally {
        if (active) {
          setAuthChecking(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  const completed = tasks.filter((task) => task.is_completed).length;
  const pending = tasks.length - completed;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const filtered = useMemo(
    () =>
      tasks.filter((task) => {
        const query = search.toLowerCase();

        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          (task.description ?? "").toLowerCase().includes(query);

        const matchesFilter =
          filter === "all" ||
          (filter === "active" && !task.is_completed) ||
          (filter === "completed" && task.is_completed);

        return matchesSearch && matchesFilter;
      }),
    [tasks, search, filter],
  );

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setModal(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setModal(true);
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setSaving(true);
    setError("");

    try {
      const body = {
        title: trimmedTitle,
        description: description.trim() || null,
      };

      if (editing) {
        await api<Task>(`/tasks/${editing.id}`, {
          method: "PATCH",
          body,
        });
      } else {
        await api<Task>("/tasks/", {
          method: "POST",
          body,
        });
      }

      setModal(false);
      await loadTasks();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Не удалось сохранить задачу: ${err.message}`
          : "Не удалось сохранить задачу.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    setError("");

    try {
      await api<Task>(`/tasks/${task.id}`, {
        method: "PATCH",
        body: { is_completed: !task.is_completed },
      });

      await loadTasks();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Не удалось изменить статус: ${err.message}`
          : "Не удалось изменить статус задачи.",
      );
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return;

    setError("");

    try {
      await api<void>(`/tasks/${task.id}`, {
        method: "DELETE",
      });

      await loadTasks();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Не удалось удалить задачу: ${err.message}`
          : "Не удалось удалить задачу.",
      );
    }
  }

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      await api<void>("/auth/logout", {
        method: "POST",
      });

      setUser(null);
      setTasks([]);
      setPage("Overview");
      setSearch("");
      setFilter("all");
      setModal(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Не удалось выйти из аккаунта: ${err.message}`
          : "Не удалось выйти из аккаунта.",
      );
    } finally {
      setLoggingOut(false);
    }
  }

  const navItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Tasks", icon: ListTodo },
    { name: "Projects", icon: FolderKanban },
  ];

  if (authChecking) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">
              <Code2 size={23} />
            </span>
            <span>
              task<span className="brand-accent">flow</span>
            </span>
          </div>
          <div className="empty-state">
            <LoaderCircle className="spin" size={24} />
            <span>Проверяем сессию...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser);
          void loadTasks();
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setPage("Overview");
          }}
        >
          <span className="brand-mark">
            <Code2 size={22} />
          </span>
          <span>
            task<span className="brand-accent">flow</span>
            <small>WORKSPACE</small>
          </span>
        </a>

        <div className="workspace-switch">
          <div className="workspace-avatar">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="workspace-info">
            <strong>Personal workspace</strong>
            <small>{user.email}</small>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="nav-list">
          {navItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "selected" : ""}`}
              onClick={() => setPage(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Tasks" && (
                <span className="nav-count">{tasks.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="nav-label tools-label">PREFERENCES</div>

        <nav className="nav-list">
          <button
            className={`nav-item ${page === "Settings" ? "selected" : ""}`}
            onClick={() => setPage("Settings")}
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <ShieldCheck size={20} />
            </div>
            <strong>Your workspace</strong>
            <p>
              Keep your workflow organized and stay focused on what matters.
            </p>
            <div className="upgrade-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <small>
              {completed} of {tasks.length} tasks completed
            </small>
          </div>

          <div className="profile">
            <div className="profile-avatar">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{user.email}</strong>
              <small>Authenticated user</small>
            </div>
            <button
              className="icon-button"
              onClick={() => void logout()}
              disabled={loggingOut}
              title="Выйти из аккаунта"
              aria-label="Выйти из аккаунта"
            >
              {loggingOut ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <LogOut size={17} />
              )}
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-separator">/</span>
            <strong>{page}</strong>
          </div>

          <div className="topbar-actions">
            <div className="api-status">
              <span className="status-dot" />
              API connected
            </div>
            <button className="icon-button" aria-label="Activity" title="Activity">
              <Activity size={18} />
            </button>
            <button
              className="icon-button notification"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">
              {user.email.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => void loadTasks()}>Retry</button>
            </div>
          )}

          {page === "Overview" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" />
                    YOUR WORKSPACE
                  </div>
                  <h1>
                    Good to see you back
                    <span className="heading-dot">.</span>
                  </h1>
                  <p className="subtitle">
                    Here's what's happening with your tasks today.
                  </p>
                </div>
                <button className="primary-button" onClick={openCreate}>
                  <Plus size={18} /> New task
                </button>
              </section>

              <section className="stats-grid">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Total tasks</span>
                    <span className="stat-icon purple">
                      <ListTodo size={19} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {loading ? "—" : tasks.length}
                  </div>
                  <div className="stat-foot">
                    <span className="stat-neutral">
                      <Activity size={13} /> Workspace
                    </span>
                    <span>All tasks</span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Completed</span>
                    <span className="stat-icon green">
                      <CheckCircle2 size={19} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {loading ? "—" : completed}
                  </div>
                  <div className="stat-foot">
                    <span className="stat-positive">
                      <ArrowUpRight size={14} /> {progress}%
                    </span>
                    <span>Completion rate</span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>In progress</span>
                    <span className="stat-icon blue">
                      <Clock3 size={19} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {loading ? "—" : pending}
                  </div>
                  <div className="stat-foot">
                    <span className="stat-neutral">
                      <Activity size={13} /> Active
                    </span>
                    <span>Need attention</span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Productivity</span>
                    <span className="stat-icon orange">
                      <Activity size={19} />
                    </span>
                  </div>
                  <div className="stat-value">
                    {loading ? "—" : `${progress}%`}
                  </div>
                  <div className="stat-foot">
                    <span className="stat-positive">
                      <ArrowUpRight size={14} /> Live data
                    </span>
                    <span>Based on tasks</span>
                  </div>
                </article>
              </section>

              <section className="content-grid">
                <article className="panel tasks-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent tasks</h2>
                      <p>Your latest work and updates</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage("Tasks")}
                    >
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="task-toolbar">
                    <div className="search-box">
                      <Search size={16} />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search tasks..."
                        aria-label="Search tasks"
                      />
                    </div>
                    <button
                      className="filter-button"
                      onClick={() =>
                        setFilter(
                          filter === "all"
                            ? "active"
                            : filter === "active"
                              ? "completed"
                              : "all",
                        )
                      }
                    >
                      {filter === "all"
                        ? "All tasks"
                        : filter === "active"
                          ? "In progress"
                          : "Completed"}
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <TaskList
                    tasks={filtered.slice(0, 5)}
                    loading={loading}
                    onToggle={toggleTask}
                    onEdit={openEdit}
                    onDelete={deleteTask}
                  />

                  <div className="panel-footer">
                    <span>
                      Showing {Math.min(filtered.length, 5)} of{" "}
                      {filtered.length} tasks
                    </span>
                    <span className="live-label">
                      <span className="status-dot" /> Synced with API
                    </span>
                  </div>
                </article>

                <article className="panel progress-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Task progress</h2>
                      <p>Workspace overview</p>
                    </div>
                    <span className="mini-dots">···</span>
                  </div>

                  <div className="progress-ring-wrap">
                    <svg viewBox="0 0 160 160" className="progress-ring">
                      <circle cx="80" cy="80" r="65" className="ring-bg" />
                      <circle
                        cx="80"
                        cy="80"
                        r="65"
                        className="ring-value"
                        strokeDasharray={`${(progress / 100) * 408.4} 408.4`}
                      />
                    </svg>
                    <div className="ring-label">
                      <strong>{progress}%</strong>
                      <span>completed</span>
                    </div>
                  </div>

                  <div className="progress-legend">
                    <div>
                      <span className="legend-dot done" />
                      <span>Completed</span>
                      <strong>{completed}</strong>
                    </div>
                    <div>
                      <span className="legend-dot active" />
                      <span>In progress</span>
                      <strong>{pending}</strong>
                    </div>
                  </div>

                  <div className="progress-note">
                    <Activity size={15} />
                    <span>
                      Progress updates automatically when you change task
                      status.
                    </span>
                  </div>
                </article>
              </section>

              <section className="bottom-banner">
                <div className="banner-icon">
                  <Code2 size={22} />
                </div>
                <div>
                  <strong>Built for your workflow</strong>
                  <p>
                    TaskFlow is connected to your FastAPI backend and
                    PostgreSQL database.
                  </p>
                </div>
                <span className="connected-badge">
                  <Check size={14} /> Connected
                </span>
              </section>
            </>
          )}

          {page === "Tasks" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" />
                    TASK MANAGEMENT
                  </div>
                  <h1>
                    All tasks<span className="heading-dot">.</span>
                  </h1>
                  <p className="subtitle">
                    Manage your work, one task at a time.
                  </p>
                </div>
                <button className="primary-button" onClick={openCreate}>
                  <Plus size={18} /> New task
                </button>
              </section>

              <section className="stats-grid compact-stats">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Total tasks</span>
                    <ListTodo size={18} />
                  </div>
                  <div className="stat-value">{tasks.length}</div>
                </article>
                <article className="stat-card">
                  <div className="stat-top">
                    <span>Completed</span>
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="stat-value">{completed}</div>
                </article>
                <article className="stat-card">
                  <div className="stat-top">
                    <span>In progress</span>
                    <Clock3 size={18} />
                  </div>
                  <div className="stat-value">{pending}</div>
                </article>
              </section>

              <article className="panel full-tasks-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Task list</h2>
                    <p>All your tasks in one place</p>
                  </div>
                </div>

                <div className="task-toolbar">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search tasks..."
                      aria-label="Search tasks"
                    />
                  </div>
                  <div className="filter-tabs">
                    {[
                      ["all", "All"],
                      ["active", "In progress"],
                      ["completed", "Completed"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        className={
                          filter === key
                            ? "filter-tab active-tab"
                            : "filter-tab"
                        }
                        onClick={() => setFilter(key)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <TaskList
                  tasks={filtered}
                  loading={loading}
                  onToggle={toggleTask}
                  onEdit={openEdit}
                  onDelete={deleteTask}
                />
              </article>
            </>
          )}

          {page === "Projects" && (
            <Placeholder
              icon={<FolderKanban size={25} />}
              title="Projects"
              text="Project management is coming next. We'll add a real projects API and database model rather than fake project data."
            />
          )}

          {page === "Settings" && (
            <Placeholder
              icon={<Settings2 size={25} />}
              title="Settings"
              text="Workspace settings will live here. API configuration is currently managed by your FastAPI environment."
            />
          )}
        </div>

        <footer className="app-footer">
          <span>© 2026 TaskFlow</span>
          <span>
            <span className="status-dot" /> All systems operational
          </span>
          <span>
            Made for focused work <span className="footer-heart">♥</span>
          </span>
        </footer>
      </main>

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModal(false);
          }}
        >
          <form className="task-modal" onSubmit={saveTask}>
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-line" /> TASK EDITOR
                </span>
                <h2>{editing ? "Edit task" : "Create a task"}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label>
              Task title
              <input
                autoFocus
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Configure monitoring"
              />
            </label>

            <label>
              Description <span className="optional-label">Optional</span>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Add some details about this task..."
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Plus size={17} />
                )}
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Create task"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function TaskList({
  tasks,
  loading,
  onToggle,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  loading: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (loading) {
    return (
      <div className="empty-state">
        <LoaderCircle className="spin" size={24} />
        <span>Loading tasks...</span>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="empty-state">
        <ListTodo size={27} />
        <strong>No tasks found</strong>
        <span>Create a task or change your search filters.</span>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div
          className={`task-row ${task.is_completed ? "task-done" : ""}`}
          key={task.id}
        >
          <button
            className={`task-check ${task.is_completed ? "checked" : ""}`}
            onClick={() => onToggle(task)}
            aria-label="Toggle completion"
          >
            {task.is_completed && <Check size={14} />}
          </button>

          <div className="task-details">
            <button className="task-title" onClick={() => onEdit(task)}>
              {task.title}
            </button>
            <span className="task-description">
              {task.description || "No description added"}
            </span>
          </div>

          <span
            className={`task-status ${
              task.is_completed ? "status-complete" : "status-progress"
            }`}
          >
            <span />
            {task.is_completed ? "Completed" : "In progress"}
          </span>

          <span className="task-date">
            {new Date(task.created_at).toLocaleDateString()}
          </span>

          <div className="task-actions">
            <button onClick={() => onEdit(task)} title="Edit" aria-label="Edit task">
              <Settings2 size={15} />
            </button>
            <button
              onClick={() => onDelete(task)}
              title="Delete"
              aria-label="Delete task"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Placeholder({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <section className="placeholder-page">
      <div className="placeholder-icon">{icon}</div>
      <h1>
        {title}
        <span className="heading-dot">.</span>
      </h1>
      <p>{text}</p>
    </section>
  );
}

export default App;
