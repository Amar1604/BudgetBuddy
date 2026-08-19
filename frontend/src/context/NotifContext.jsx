import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationAPI, profileAPI } from '../services/services';
import { useAuth } from './AuthContext';

const NotifContext = createContext(null);

export function NotifProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState([]);
  const registeredUser = useRef(null);
  const previousNotifs = useRef([]);

  const addToast = (title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showPushNotification = (title, message) => {
    // 1. Native Desktop Notification fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.error("Native push error:", e);
      }
    }
    // 2. Custom HTML floating overlay toast (premium visual effect)
    addToast(title, message);
  };

  const refresh = useCallback((isFirstLoad = false) => {
    if (!user) return;
    notificationAPI.list().then(({ data }) => {
      const currentUnread = data.filter((n) => !n.is_read);
      setUnread(currentUnread.length);

      // If it's not the first load, detect new unread notifications since last sync
      if (!isFirstLoad && previousNotifs.current.length > 0) {
        currentUnread.forEach((notif) => {
          const wasPresent = previousNotifs.current.some((prevId) => prevId === notif.id);
          if (!wasPresent) {
            // Trigger push notifications
            showPushNotification(notif.title, notif.message);
          }
        });
      }

      // Track all current unread notifications
      previousNotifs.current = currentUnread.map((n) => n.id);
    }).catch(() => {});
  }, [user]);

  // Request browser desktop notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Register simulated FCM device token on login
  useEffect(() => {
    if (user && registeredUser.current !== user.id) {
      registeredUser.current = user.id;
      
      const mockToken = `mock_fcm_token_${user.id}_${Math.floor(1000 + Math.random() * 9000)}`;
      profileAPI.registerFCMToken(mockToken)
        .then(() => console.log("FCM device token registered: ", mockToken))
        .catch((err) => console.error("Failed to register simulated FCM token:", err));

      // Trigger first load sync
      refresh(true);
    } else if (!user) {
      registeredUser.current = null;
      previousNotifs.current = [];
    }
  }, [user, refresh]);

  // Periodic polling check every 10 seconds for high responsiveness in push alerts
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => refresh(false), 10000);
    return () => clearInterval(id);
  }, [user, refresh]);

  return (
    <NotifContext.Provider value={{ unread, refresh, addToast }}>
      {children}

      {/* Floating Push Notification Toast Container */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 360,
        width: '100%',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              border: '1px solid rgba(95, 59, 246, 0.4)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(12px)',
              color: '#f8fafc',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              pointerEvents: 'auto',
              animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>🔔 Push Notification</strong>
              <button 
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <strong style={{ fontSize: 14, color: '#f8fafc', marginTop: 2 }}>{toast.title}</strong>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>{toast.message}</p>

            <style>{`
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
            `}</style>
          </div>
        ))}
      </div>
    </NotifContext.Provider>
  );
}

export const useNotifCount = () => useContext(NotifContext)?.unread || 0;
export const useNotifRefresh = () => useContext(NotifContext)?.refresh || (() => {});
