import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-5">
          <p className="text-sm text-danger mb-4">页面出了点问题，请刷新重试</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-medium"
          >
            刷新页面
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
