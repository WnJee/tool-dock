/** 浏览器端下载助手：所有本地工具共用，避免每个页面重复创建 <a download> */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  // 大文件下载会持续读取该 URL，过早 revoke 会在 Safari 上中断下载
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function downloadText(value: string, filename: string): void {
  downloadBlob(new Blob([value], { type: 'text/plain;charset=utf-8' }), filename)
}
