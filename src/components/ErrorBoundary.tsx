import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// Last line of defence: a throw anywhere in the tree (a blocked storage
// accessor, a corrupt payload, a bad render) must not leave a blank page.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { error: null }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[error-boundary] the board crashed:', error, info.componentStack)
  }

  public render(): ReactNode {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }
    return (
      <div className="crash" role="alert">
        <h1 className="crash__title">The board could not be loaded</h1>
        <p className="crash__detail">{error.message}</p>
        <button
          type="button"
          className="crash__reload"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    )
  }
}
