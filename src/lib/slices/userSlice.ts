import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserPlan = 'starter' | 'professional' | 'enterprise';

export interface User {
  id: string;
  emailAddress: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  credits: number;
  plan: UserPlan;
}

// Plan limits constants
export const PLAN_LIMITS = {
  starter: {
    maxProjects: 3,
    name: 'Starter',
  },
  professional: {
    maxProjects: 10,
    name: 'Professional',
  },
  enterprise: {
    maxProjects: Infinity,
    name: 'Enterprise',
  },
} as const;

export interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateUserCredits: (state, action: PayloadAction<number>) => {
      if (state.currentUser) {
        state.currentUser.credits = action.payload;
      }
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
});

export const {
  setUser,
  clearUser,
  setLoading,
  setError,
  updateUserCredits,
  updateUserProfile,
} = userSlice.actions;

export default userSlice.reducer;
