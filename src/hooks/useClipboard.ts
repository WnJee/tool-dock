import { useCallback, useEffect, useRef, useState } from 'react'

export const COPY_FEEDBACK_MS = 1200

/**
 * 统一的复制反馈状态：`copied` 记录最近一次成功复制的目标 id，
 * 超时后自动回落，避免每个页面各写一份 setTimeout 逻辑。
 */
export function useClipboard(resetMs: number = COPY_FEEDBACK_MS) {
  const [copied, setCopied] = useState('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = useCallback(
    async (value: string, id = 'default') => {
      if (!value) return false
      try {
        await navigator.clipboard.writeText(value)
      } catch {
        return false
      }
      setCopied(id)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied((current) => (current === id ? '' : current)), resetMs)
      return true
    },
    [resetMs],
  )

  const reset = useCallback(() => setCopied(''), [])

  return { copied, copy, reset }
}
