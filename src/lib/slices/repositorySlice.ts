import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GitHubRepoInfo } from "../github";

interface RepositoryState {
  currentRepository: GitHubRepoInfo | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: RepositoryState = {
  currentRepository: null,
  isLoading: false,
  error: null,
  lastFetched: null,
};

const repositorySlice = createSlice({
  name: "repository",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setRepository: (state, action: PayloadAction<GitHubRepoInfo>) => {
      state.currentRepository = action.payload;
      state.error = null;
      state.lastFetched = new Date().toISOString();
    },
    clearRepository: (state) => {
      state.currentRepository = null;
      state.error = null;
      state.lastFetched = null;
    },
    updateRepositoryStats: (
      state,
      action: PayloadAction<
        Partial<
          Pick<GitHubRepoInfo, "stars" | "forks" | "watchers" | "openIssues">
        >
      >
    ) => {
      if (state.currentRepository) {
        state.currentRepository = {
          ...state.currentRepository,
          ...action.payload,
        };
      }
    },
  },
});

export const {
  setLoading,
  setError,
  setRepository,
  clearRepository,
  updateRepositoryStats,
} = repositorySlice.actions;

export default repositorySlice.reducer;
