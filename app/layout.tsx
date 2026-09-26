import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'نبض | NABD — A world worth discovering',description:'أخبار العلوم والتقنية بأربع لغات، ومصادر واضحة ومستويات للأدلة.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning><body>{children}</body></html>}
