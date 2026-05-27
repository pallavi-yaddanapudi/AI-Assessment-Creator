import React from 'react';
import type { Metadata } from 'next';
import '../styles/globals.css';
import { ReduxProvider } from '../store/provider';

export const metadata: Metadata = {
  title: 'VedaAI - Assessment Creator',
  description: 'Generate high-quality, structured academic assessments instantly using artificial intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
