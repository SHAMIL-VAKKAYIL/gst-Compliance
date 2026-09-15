import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black'
              size?: 'large' | 'medium' | 'small'
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
              width?: number
              shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            }
          ) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => Promise<void>
  disabled?: boolean
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export function GoogleSignInButton({ onCredential, disabled }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [scriptError, setScriptError] = useState<string | null>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !buttonRef.current) return

    const init = () => {
      if (!window.google || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          void onCredential(response.credential)
        },
        auto_select: false,
      })

      window.google.accounts.id.disableAutoSelect()

      // Clear anything previously rendered (e.g. on re-init) before rendering again
      buttonRef.current.innerHTML = ''

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 320,
      })
    }

    const existing = document.getElementById('google-gsi')
    if (existing) {
      init()
      return
    }

    const script = document.createElement('script')
    script.id = 'google-gsi'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = init
    script.onerror = () => setScriptError('Could not load Google Sign-In.')
    document.body.appendChild(script)
  }, [onCredential])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="google-fallback">
        <p className="muted">Google sign-in is not configured yet.</p>
      </div>
    )
  }

  return (
    <div className="google-button-wrap">
      {scriptError ? <p className="form-error">{scriptError}</p> : null}
      <div
        ref={buttonRef}
        aria-disabled={disabled}
        style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
      />
    </div>
  )
}