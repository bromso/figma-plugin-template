import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  basePath: "/figma-plugin-template",
  reactStrictMode: true,
  images: { unoptimized: true },
};

const withMDX = createMDX();

export default withMDX(config);
