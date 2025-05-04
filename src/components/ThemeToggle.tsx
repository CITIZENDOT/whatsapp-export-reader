// src/components/ThemeToggle.tsx
import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button' // Adjust path if needed
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setThemeState(isDarkMode ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    if (theme === 'system') return

    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)

    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="fixed top-10 right-10 " // Increased button size
    >
      <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" size={64} />
      <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" size={64} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

export default ThemeToggle
