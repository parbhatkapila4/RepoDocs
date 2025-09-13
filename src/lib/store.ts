import { configureStore } from '@reduxjs/toolkit'
import { projectSlice } from './slices/projectSlice'
import userReducer from './slices/userSlice'

export const store = configureStore({
  reducer: {
    project: projectSlice.reducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
