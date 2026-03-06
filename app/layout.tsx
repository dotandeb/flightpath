import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlightPath - Find the Cheapest Flight Deals',
  description: 'Search millions of flights to find the best deals. Compare prices from airlines, travel sites, and deal aggregators. Save with split tickets and hidden city fares.',
  keywords: 'cheap flights, flight deals, airline tickets, travel, airfare, flight search, split tickets, error fares',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}