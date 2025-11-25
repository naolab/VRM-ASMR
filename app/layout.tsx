import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VRM ASMR',
  description: 'VRM × WebAudio 立体音響デモ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}