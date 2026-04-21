import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import "./global.css";

export const metadata = {
  title: {
    default: "Figma Plugin Template",
    template: "%s | Figma Plugin Template",
  },
  description: "Build Figma plugins with React, Vite, TypeScript, and AI skills",
  metadataBase: new URL("https://bromso.github.io/figma-plugin-template"),
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
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
