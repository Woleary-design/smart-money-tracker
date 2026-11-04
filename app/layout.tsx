import type { Metadata } from "next";
export const metadata: Metadata = {title:"Smart Money Tracker",description:"Evidence-first trader discovery and risk analytics"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body style={{margin:0,background:"#0b1220",color:"#e5e7eb",fontFamily:"Arial, sans-serif"}}>{children}</body></html>}