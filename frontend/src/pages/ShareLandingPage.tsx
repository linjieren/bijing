import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export default function ShareLandingPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) {
      setError('无效的分享链接')
      return
    }

    async function resolve() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/share/${code}`, {
          headers: { 'X-Anonymous-Id': getAnonymousId() },
        })
        const json = await res.json()
        if (!json.success || !json.data?.story?.id) {
          setError('分享链接已失效或故事不存在')
          return
        }
        navigate(`/reader/${json.data.story.id}`)
      } catch {
        setError('加载失败，请检查网络后重试')
      }
    }

    resolve()
  }, [code, navigate])

  if (error) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-5">
        <p className="text-sm text-danger mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium"
        >
          返回首页
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
      <p className="text-sm text-text-secondary">正在打开故事…</p>
    </div>
  )
}

function getAnonymousId(): string {
  let id = localStorage.getItem('bijing-anonymous-id')
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem('bijing-anonymous-id', id)
  }
  return id
}
