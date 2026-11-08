import type { Metadata } from 'next';
import './globals.css';
import './companies.css';
export const metadata: Metadata = { title:'Amazon Reuse | Gestão Ambiental', description:'ERP ambiental multiempresa' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
