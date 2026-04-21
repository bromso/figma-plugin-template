import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import "./global.css";

const SITE_URL = "https://bromso.github.io/figma-plugin-template";

export const metadata = {
  title: {
    default: "Figma Plugin Template",
    template: "%s | Figma Plugin Template",
  },
  description: "Build Figma plugins with React, Vite, TypeScript, and AI skills",
  metadataBase: new URL(SITE_URL),
};

// Static constant — no user input, safe for inline injection
const websiteJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Figma Plugin Template Docs",
  description: "Build Figma plugins with React, Vite, TypeScript, and AI skills",
  url: SITE_URL,
  publisher: {
    "@type": "Organization",
    name: "Figma Plugin Template",
    url: "https://github.com/bromso/figma-plugin-template",
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from static constant */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd }} />
        <RootProvider
          search={{
            options: {
              type: "static",
            },
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
