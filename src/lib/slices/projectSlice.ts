import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Project {
  id: string
  name: string
  description?: string
  githubUrl: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  readmeContent?: string
  documentation?: string
  architectureDiagram?: string
  error?: string
}

export interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  selectedProjectId: string | null
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  selectedProjectId: null,
}

export const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    // Project CRUD operations
    addProject: (state, action: PayloadAction<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newProject: Project = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      state.projects.push(newProject)
      state.currentProject = newProject
      state.selectedProjectId = newProject.id
    },

    updateProject: (state, action: PayloadAction<{ id: string; updates: Partial<Project> }>) => {
      const { id, updates } = action.payload
      const projectIndex = state.projects.findIndex(project => project.id === id)
      
      if (projectIndex !== -1) {
        state.projects[projectIndex] = {
          ...state.projects[projectIndex],
          ...updates,
          updatedAt: new Date().toISOString(),
        }
        
        if (state.currentProject?.id === id) {
          state.currentProject = state.projects[projectIndex]
        }
      }
    },

    deleteProject: (state, action: PayloadAction<string>) => {
      const projectId = action.payload
      state.projects = state.projects.filter(project => project.id !== projectId)
      
      if (state.currentProject?.id === projectId) {
        state.currentProject = null
        state.selectedProjectId = null
      }
    },

    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload
      state.selectedProjectId = action.payload?.id || null
    },

    selectProject: (state, action: PayloadAction<string>) => {
      const projectId = action.payload
      const project = state.projects.find(p => p.id === projectId)
      if (project) {
        state.currentProject = project
        state.selectedProjectId = projectId
      }
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // Project processing states
    startProcessing: (state, action: PayloadAction<string>) => {
      const projectId = action.payload
      const project = state.projects.find(p => p.id === projectId)
      if (project) {
        project.status = 'processing'
        project.updatedAt = new Date().toISOString()
      }
    },

    completeProcessing: (state, action: PayloadAction<{
      id: string
      readmeContent?: string
      documentation?: string
      architectureDiagram?: string
    }>) => {
      const { id, readmeContent, documentation, architectureDiagram } = action.payload
      const project = state.projects.find(p => p.id === id)
      if (project) {
        project.status = 'completed'
        project.readmeContent = readmeContent
        project.documentation = documentation
        project.architectureDiagram = architectureDiagram
        project.updatedAt = new Date().toISOString()
        project.error = undefined
      }
    },

    failProcessing: (state, action: PayloadAction<{ id: string; error: string }>) => {
      const { id, error } = action.payload
      const project = state.projects.find(p => p.id === id)
      if (project) {
        project.status = 'failed'
        project.error = error
        project.updatedAt = new Date().toISOString()
      }
    },

    // Bulk operations
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload
    },

    clearProjects: (state) => {
      state.projects = []
      state.currentProject = null
      state.selectedProjectId = null
    },

    // Reset state
    resetProjectState: () => {
      return initialState
    },
  },
})

export const {
  addProject,
  updateProject,
  deleteProject,
  setCurrentProject,
  selectProject,
  setLoading,
  setError,
  startProcessing,
  completeProcessing,
  failProcessing,
  setProjects,
  clearProjects,
  resetProjectState,
} = projectSlice.actions

export default projectSlice.reducer
