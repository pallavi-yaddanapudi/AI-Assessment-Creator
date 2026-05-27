'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch } from './index';
import { restoreSession } from './authSlice';

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('veda_auth_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          dispatch(restoreSession(parsed));
        } catch (e) {
          console.error('Session restore failed', e);
          dispatch(restoreSession(null));
        }
      } else {
        dispatch(restoreSession(null));
      }
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionInitializer>{children}</SessionInitializer>
    </Provider>
  );
}
