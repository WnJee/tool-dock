import { Check, Copy } from 'lucide-react'

export default function CopyStatus({ copied }: { copied: boolean }) {
  return (
    <>
      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? '已复制' : '复制'}
    </>
  )
}
