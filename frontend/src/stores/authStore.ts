import { create } from 'zustand'
import type { AuthUser, UserStats } from '../types'

interface AuthState {
  token: string | null
  user: AuthUser | null
  stats: UserStats | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  fetchUser: () => Promise<void>
  setStats: (stats: UserStats) => void
}

const STORAGE_KEY = 'bijing-auth-token'

function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  user: null,
  stats: null,
  isLoggedIn: false,
  isLoading: true,

  login: (token: string, user: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, token)
    set({ token, user, isLoggedIn: true, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null, stats: null, isLoggedIn: false, isLoading: false })
  },

  fetchUser: async () => {
    const token = get().token
    if (!token) {
      set({ isLoading: false })
      return
    }
    set({ isLoading: true })
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const json = await res.json()
      if (json.success && json.data) {
        const data = json.data as AuthUser & { stats?: UserStats }
        set({
          user: {
            id: data.id,
            nickname: data.nickname,
            avatar_color: data.avatar_color,
            phone: data.phone,
          },
          stats: data.stats || null,
          isLoggedIn: true,
        })
      } else {
        // token 失效，自动登出
        localStorage.removeItem(STORAGE_KEY)
        set({ token: null, user: null, stats: null, isLoggedIn: false })
      }
    } catch {
      // 网络错误不处理，保持当前状态
    } finally {
      set({ isLoading: false })
    }
  },

  setStats: (stats: UserStats) => {
    set({ stats })
  },
}))

// 应用启动时自动恢复
export function initAuth() {
  const store = useAuthStore.getState()
  if (store.token) {
    store.fetchUser()
  } else {
    store.logout()
  }
}
