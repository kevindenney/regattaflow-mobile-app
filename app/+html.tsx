import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML document for Expo Router web.
 * This file controls the <html> and <head> for all pages.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="n53JxiUdY0k_64zSxt07pdPyM1kBuYhSRrXvDLzA_vE" />
        
        {/* Primary Meta Tags */}
        <title>RegattaFlow - AI-Powered Sailing Race Strategy & Performance</title>
        <meta name="title" content="RegattaFlow - AI-Powered Sailing Race Strategy & Performance" />
        <meta name="description" content="Master sailing race strategy with AI-powered venue intelligence, real-time wind analysis, and personalized coaching. Track performance, plan races, and outsmart the competition." />
        <meta name="keywords" content="sailing, regatta, race strategy, sailing coach, wind shifts, venue intelligence, race planning, sailing performance, yacht racing, dinghy racing" />
        <meta name="author" content="RegattaFlow" />
        <meta name="robots" content="index, follow" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://regattaflow.oceanflow.io/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://regattaflow.oceanflow.io/" />
        <meta property="og:title" content="RegattaFlow - AI-Powered Sailing Race Strategy" />
        <meta property="og:description" content="Master sailing race strategy with AI-powered venue intelligence, real-time wind analysis, and personalized coaching." />
        <meta property="og:image" content="https://regattaflow.oceanflow.io/assets/images/og-image.png" />
        <meta property="og:site_name" content="RegattaFlow" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://regattaflow.oceanflow.io/" />
        <meta name="twitter:title" content="RegattaFlow - AI-Powered Sailing Race Strategy" />
        <meta name="twitter:description" content="Master sailing race strategy with AI-powered venue intelligence, real-time wind analysis, and personalized coaching." />
        <meta name="twitter:image" content="https://regattaflow.oceanflow.io/assets/images/og-image.png" />
        
        {/* Theme */}
        <meta name="theme-color" content="#0066CC" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "RegattaFlow",
              "applicationCategory": "SportsApplication",
              "operatingSystem": "Web, iOS, Android",
              "description": "AI-powered sailing race strategy, performance tracking, and venue intelligence for competitive sailors worldwide",
              "url": "https://regattaflow.oceanflow.io",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        
        {/* Expo Router scroll reset */}
        <ScrollViewStyleReset />
        
        {/* Critical styles for Expo Router web */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          body {
            overflow: auto;
            overscroll-behavior-y: none;
          }
          #root {
            display: flex;
            flex-direction: column;
            min-height: 100%;
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}

