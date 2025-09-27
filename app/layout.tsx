import Header from '@/components/header';
import Footer from '@/components/footer';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: {
    default: 'OG Preview - The Ultimate Open Graph Image Gallery',
    template: '%s | OG Preview',
  },
  description:
    'Discover and explore beautiful Open Graph images from websites across the internet. Browse our curated gallery of social media preview images and get inspiration for your own designs.',
  keywords: ['open graph', 'og image', 'social media', 'preview', 'gallery', 'meta tags', 'web design', 'social sharing'],
  authors: [{ name: 'Danilo Vilhena' }],
  creator: 'Danilo Vilhena',
  publisher: 'Danilo Vilhena',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ogpreview.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ogpreview.com',
    title: 'OG Preview - The Ultimate Open Graph Image Gallery',
    description:
      'Discover and explore beautiful Open Graph images from websites across the internet. Browse our curated gallery of social media preview images.',
    siteName: 'OG Preview',
    images: [
      {
        url: '/ogpreview.png',
        width: 1200,
        height: 630,
        alt: 'OG Preview - Open Graph Image Gallery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OG Preview - The Ultimate Open Graph Image Gallery',
    description: 'Discover and explore beautiful Open Graph images from websites across the internet.',
    creator: '@danilo_swe',
    images: ['/ogpreview.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OG Preview" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'OG Preview',
              description: 'The Ultimate Open Graph Image Gallery - Discover and explore beautiful Open Graph images from websites across the internet.',
              url: 'https://ogpreview.com',
              author: {
                '@type': 'Person',
                name: 'Danilo Vilhena',
                sameAs: 'https://twitter.com/danilo_swe',
              },
              publisher: {
                '@type': 'Person',
                name: 'Danilo Vilhena',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://ogpreview.com?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" /> */}
        {/* rest of your scripts go under */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased relative overflow-x-hidden`}>
        <div className="fixed top-0 left-0 z-[-2] h-screen w-full bg-white bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,163,255,0.13)_0,rgba(0,163,255,0)_50%,rgba(0,163,255,0)_100%)]"></div>
        <Header />
        {children}
        <Footer />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
