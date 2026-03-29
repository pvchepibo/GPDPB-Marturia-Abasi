import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'GPDPB Marturia Abasi Official',
  description: 'Website resmi GPDPB Marturia Abasi Official dengan fitur Warta Jemaat real-time, Laporan Kas Keuangan, dan Layanan Jemaat Digital.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⛪</text></svg>"
        />
      </head>
      <body className="font-sans antialiased bg-stone-50 text-stone-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
