import React from "react";
import { X, CheckCircle, AlertTriangle, Info, Zap } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    style?: "primary" | "secondary";
  }>;
}

interface NotificationState {
  notifications: Notification[];
}

type NotificationListener = (notifications: Notification[]) => void;

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: NotificationListener[] = [];
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    // Immediately call with current notifications
    listener(this.notifications);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.warn("Notification listener error:", error);
      }
    });
  }

  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  show(notification: Omit<Notification, "id">): string {
    const id = this.generateId();
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    this.notifications.unshift(newNotification);

    // Keep only last 5 notifications
    if (this.notifications.length > 5) {
      this.notifications = this.notifications.slice(0, 5);
    }

    this.notifyListeners();

    // Auto dismiss after duration
    if (newNotification.duration && newNotification.duration > 0) {
      const timeout = setTimeout(() => {
        this.dismiss(id);
      }, newNotification.duration);

      this.timeouts.set(id, timeout);
    }

    return id;
  }

  dismiss(id: string) {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }

    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notifyListeners();
  }

  clear() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.timeouts.clear();
    this.notifications = [];
    this.notifyListeners();
  }

  // Convenience methods
  success(title: string, message?: string, options?: Partial<Notification>) {
    return this.show({ type: "success", title, message, ...options });
  }

  error(title: string, message?: string, options?: Partial<Notification>) {
    return this.show({
      type: "error",
      title,
      message,
      duration: 8000,
      ...options,
    });
  }

  warning(title: string, message?: string, options?: Partial<Notification>) {
    return this.show({
      type: "warning",
      title,
      message,
      duration: 6000,
      ...options,
    });
  }

  info(title: string, message?: string, options?: Partial<Notification>) {
    return this.show({ type: "info", title, message, ...options });
  }
}

export const racingNotifications = new NotificationManager();

class RacingNotificationsContainer extends React.Component<
  {},
  NotificationState
> {
  private unsubscribe: (() => void) | null = null;

  constructor(props: {}) {
    super(props);
    this.state = { notifications: [] };
  }

  componentDidMount() {
    this.unsubscribe = racingNotifications.subscribe((notifications) => {
      this.setState({ notifications });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    const { notifications } = this.state;

    if (notifications.length === 0) return null;

    return (
      <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-80 pointer-events-none">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onDismiss={() => racingNotifications.dismiss(notification.id)}
            />
          </div>
        ))}
      </div>
    );
  }
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

class NotificationItem extends React.Component<NotificationItemProps> {
  componentDidMount() {
    // Animation is now handled by CSS classes directly
  }

  componentWillUnmount() {
    // No cleanup needed
  }

  getNotificationStyles() {
    const { type } = this.props.notification;

    switch (type) {
      case "success":
        return {
          container:
            "bg-green-900/20 border-green-500/30 border backdrop-blur-sm",
          icon: "text-green-400",
          title: "text-green-400",
        };
      case "error":
        return {
          container: "bg-red-900/20 border-red-500/30 border backdrop-blur-sm",
          icon: "text-red-400",
          title: "text-red-400",
        };
      case "warning":
        return {
          container:
            "bg-yellow-900/20 border-yellow-500/30 border backdrop-blur-sm",
          icon: "text-yellow-400",
          title: "text-yellow-400",
        };
      case "info":
        return {
          container:
            "bg-blue-900/20 border-blue-500/30 border backdrop-blur-sm",
          icon: "text-blue-400",
          title: "text-blue-400",
        };
      default:
        return {
          container:
            "bg-gray-800/80 border-gray-600/50 border backdrop-blur-sm",
          icon: "text-gray-400",
          title: "text-white",
        };
    }
  }

  getIcon() {
    const { type } = this.props.notification;
    switch (type) {
      case "success":
        return CheckCircle;
      case "error":
        return AlertTriangle;
      case "warning":
        return AlertTriangle;
      case "info":
        return Info;
      default:
        return Zap;
    }
  }

  render() {
    const { notification, onDismiss } = this.props;
    const styles = this.getNotificationStyles();
    const Icon = this.getIcon();

    return (
      <div
        id={notification.id}
        className={`${styles.container} rounded-lg p-4 shadow-2xl relative overflow-hidden group transform transition-all duration-300 ease-out`}
        style={{
          animation: "slide-in-from-right 0.4s ease-out forwards",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Enhanced border glow effect */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-lg border border-white/10" />
        </div>

        <div className="relative z-10 flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className={`font-semibold text-sm ${styles.title} leading-tight`}
            >
              {notification.title}
            </h4>
            {notification.message && (
              <p className="text-sm text-gray-300 mt-1 leading-snug">
                {notification.message}
              </p>
            )}

            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-3">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action();
                      onDismiss();
                    }}
                    className={`text-xs px-3 py-1.5 rounded transition-all duration-200 font-medium ${
                      action.style === "primary"
                        ? "bg-racing-orange/20 hover:bg-racing-orange/30 text-racing-orange border border-racing-orange/30 hover:border-racing-orange/50"
                        : "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white border border-gray-600/30 hover:border-gray-500/50"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200 p-1 -m-1 rounded hover:bg-white/10"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
}

export function RacingNotifications() {
  return <RacingNotificationsContainer />;
}

// Export for easy use in components
export { racingNotifications as notify };
