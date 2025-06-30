import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info, Zap, Trophy, Flag, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationAction {
  label: string;
  action: () => void;
  style?: "primary" | "secondary" | "danger";
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info" | "racing" | "achievement" | "flag" | "performance";
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  notify: (notification: Omit<Notification, "id" | "timestamp">) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((notification: Omit<Notification, "id" | "timestamp">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
    };

    setNotifications(prev => [...prev, newNotification]);

    if (notification.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, notification.duration || 5000);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss, clearAll }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, dismiss } = useNotifications();

  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onDismiss={dismiss} />
      ))}
    </div>,
    document.body
  );
};

const NotificationItem: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({
  notification,
  onDismiss,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-400" />;
      case "racing":
        return <Zap className="h-5 w-5 text-racing-orange" />;
      case "achievement":
        return <Trophy className="h-5 w-5 text-racing-yellow" />;
      case "flag":
        return <Flag className="h-5 w-5 text-racing-red" />;
      case "performance":
        return <Gauge className="h-5 w-5 text-racing-green" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-900/90 border-green-700";
      case "error":
        return "bg-red-900/90 border-red-700";
      case "warning":
        return "bg-yellow-900/90 border-yellow-700";
      case "info":
        return "bg-blue-900/90 border-blue-700";
      case "racing":
        return "bg-racing-orange/90 border-racing-orange";
      case "achievement":
        return "bg-racing-yellow/90 border-racing-yellow";
      case "flag":
        return "bg-racing-red/90 border-racing-red";
      case "performance":
        return "bg-racing-green/90 border-racing-green";
      default:
        return "bg-gray-900/90 border-gray-700";
    }
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border backdrop-blur-sm shadow-lg transform transition-all duration-300 animate-in slide-in-from-right",
        getBgColor()
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-1">{notification.title}</h4>
          <p className="text-sm text-gray-200 mb-3">{notification.message}</p>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-medium transition-colors",
                    action.style === "primary" && "bg-racing-orange hover:bg-racing-orange/80 text-white",
                    action.style === "secondary" && "bg-gray-700 hover:bg-gray-600 text-white",
                    action.style === "danger" && "bg-red-600 hover:bg-red-700 text-white",
                    !action.style && "bg-gray-700 hover:bg-gray-600 text-white"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Convenience functions
export const notify = {
  success: (title: string, message: string, options?: Partial<Notification>) => {
    // This will be used with the context
    console.log("Success notification:", title, message);
  },
  error: (title: string, message: string, options?: Partial<Notification>) => {
    console.log("Error notification:", title, message);
  },
  warning: (title: string, message: string, options?: Partial<Notification>) => {
    console.log("Warning notification:", title, message);
  },
  info: (title: string, message: string, options?: Partial<Notification>) => {
    console.log("Info notification:", title, message);
  },
  racing: (title: string, message: string, options?: Partial<Notification>) => {
    console.log("Racing notification:", title, message);
  },
  achievement: (title: string, message: string, options?: Partial<Notification>) => {
    console.log("Achievement notification:", title, message);
  },
  flag: (title: string, message: string, options?: Partial<Notification>) => {
    console.log("Flag notification:", title, message);
  },
  performance: (title: string, message: string, options?: Partial<Notification>) => {
    console.log("Performance notification:", title, message);
  },
};
