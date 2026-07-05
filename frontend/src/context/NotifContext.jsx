import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../api/services';
import { useAuth } from './AuthContext';

const NotifContext = createContext(0);

export function NotifProvider({ children }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    if (!user) return;
    notificationAPI.list().then(({ data }) => {
      setUnread(data.filter((n) => !n.is_read).length);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [refresh]);

  return <NotifContext.Provider value={{ unread, refresh }}>{children}</NotifContext.Provider>;
}

export const useNotifCount = () => useContext(NotifContext).unread;
export const useNotifRefresh = () => useContext(NotifContext).refresh;
