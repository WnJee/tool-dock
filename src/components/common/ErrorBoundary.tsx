import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  message: string
}

/** 单页渲染异常时兜底，避免整块工作台变成白屏 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: '' }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: error instanceof Error ? error.message : '页面渲染失败' }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('页面渲染失败', error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.message) return this.props.children
    return (
      <div className="error-boundary" role="alert">
        <TriangleAlert size={22} />
        <strong>当前页面渲染失败</strong>
        <code>{this.state.message}</code>
        <button type="button" className="secondary-button" onClick={() => this.setState({ message: '' })}>
          <RotateCcw size={14} /> 重试
        </button>
      </div>
    )
  }
}
