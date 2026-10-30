import type { Metadata } from 'next';
import './globals.css'; // <--- ADD THIS IMPORT

export const metadata: Metadata = {
  title: 'Manufacturer Panel',
  description: 'Bharat Trade Manufacturer Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}