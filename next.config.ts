import type { NextConfig } from "next";
import path from "path";
import { withContentCollections } from "@content-collections/next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      "content-collections": "./.content-collections/generated/index.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias["content-collections"] = path.join(
      process.cwd(),
      ".content-collections/generated/index.js"
    );
    return config;
  },
};

export default withContentCollections(nextConfig);
