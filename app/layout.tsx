import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tribearium Agent',
  description: 'WhatsApp AI Agent Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface min-h-screen">{children}</body>
    </html>
  );
}
