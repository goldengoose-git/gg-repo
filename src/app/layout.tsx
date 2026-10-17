import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GG · Customer Journey Repository',
  description: 'Golden Goose SFMC Customer Journey Repository',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Font display/UI originali */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/* Font GoldenGooseSans (stessa stylesheet dell'originale SFMC) */}
        <link href="https://cloud.mailer.goldengoose.com/fontsgolden.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
