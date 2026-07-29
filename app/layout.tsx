import type { Metadata } from "next";
import { Geist_Mono, Raleway } from "next/font/google";

import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard Kpis Projetos",
  description:
    "Painel de acompanhamento de issues GitLab — KPIs, parceria, área, repositório e qualidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${raleway.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css"
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <a href="#conteudo-principal" className="skip-link">
          Pular para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
