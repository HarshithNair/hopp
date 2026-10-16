import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata={title:'HOPP: offline messaging and emergency profile',description:'Queue messages without a network, keep an emergency profile with a QR, and cache a map of your area.',manifest:'/manifest.webmanifest',icons:{icon:'/brand/hopp-icon-192.png',apple:'/brand/hopp-icon-192.png'},appleWebApp:{capable:true,statusBarStyle:'default'}};
export const viewport: Viewport={width:'device-width',initialScale:1,themeColor:'#EDB923'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>}
