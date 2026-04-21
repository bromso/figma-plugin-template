import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import "./global.css";

export const metadata = {
  title: "Figma Plugin Template",
  description: "Build Figma plugins with React, Vite, TypeScript, and AI skills",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
