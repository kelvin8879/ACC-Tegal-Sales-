import './globals.css';

export const metadata = {
  title: 'Sales Monitoring System - ACC Tegal',
  description: 'Mobile-friendly Sales C1 performance dashboard for Officers and Coordinators',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
