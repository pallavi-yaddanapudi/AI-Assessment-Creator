import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IUser {
  name: string;
  email: string;
  role: 'teacher' | 'student';
  rollNo?: string;
  section?: string;
}

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreSession(state, action: PayloadAction<IUser | null>) {
      if (action.payload) {
        state.user = action.payload;
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.isAuthenticated = false;
      }
      state.isInitialized = true;
    },
    loginSuccess(state, action: PayloadAction<IUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('veda_auth_user', JSON.stringify(action.payload));
      }
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('veda_auth_user');
      }
    },
    updateProfile(state, action: PayloadAction<{ name: string; rollNo?: string; section?: string }>) {
      if (state.user) {
        state.user.name = action.payload.name;
        if (action.payload.rollNo !== undefined) state.user.rollNo = action.payload.rollNo;
        if (action.payload.section !== undefined) state.user.section = action.payload.section;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('veda_auth_user', JSON.stringify(state.user));
        }
      }
    }
  }
});

export const { restoreSession, loginSuccess, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
