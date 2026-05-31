import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "img.shields.io" },
    ],
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  serverExternalPackages: ["jspdf", "html2canvas", "canvg"],

  turbopack: {
    resolveAlias: {
      raf: "./src/lib/raf-polyfill.js",
      rgbcolor: "./src/lib/rgbcolor-polyfill.js",
      "stackblur-canvas": "./src/lib/stackblur-polyfill.js",
    },
  },

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "node:fs": false,
        "node:fs/promises": false,
        "node:path": false,
        "node:crypto": false,
        "node:stream": false,
        "node:util": false,
        "node:buffer": false,
        "node:url": false,
      };

      config.plugins = config.plugins || [];

      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );

      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^node:fs\/promises$/,
        })
      );
    }

    const nodeModulesPath = path.resolve(__dirname, "node_modules");
    const fs = require("fs");

    let rgbcolorPath = path.resolve(nodeModulesPath, "rgbcolor");
    if (!fs.existsSync(rgbcolorPath + ".js") && !fs.existsSync(rgbcolorPath)) {
      const possiblePaths = [
        path.resolve(nodeModulesPath, "canvg", "node_modules", "rgbcolor"),
        path.resolve(
          nodeModulesPath,
          "jspdf",
          "node_modules",
          "canvg",
          "node_modules",
          "rgbcolor"
        ),
      ];
      for (const possiblePath of possiblePaths) {
        if (
          fs.existsSync(possiblePath) ||
          fs.existsSync(possiblePath + ".js")
        ) {
          rgbcolorPath = possiblePath;
          break;
        }
      }
    }

    let svgPathdataPath = path.resolve(nodeModulesPath, "svg-pathdata");
    if (
      !fs.existsSync(svgPathdataPath + ".js") &&
      !fs.existsSync(svgPathdataPath)
    ) {
      const possiblePaths = [
        path.resolve(nodeModulesPath, "canvg", "node_modules", "svg-pathdata"),
        path.resolve(
          nodeModulesPath,
          "jspdf",
          "node_modules",
          "canvg",
          "node_modules",
          "svg-pathdata"
        ),
      ];
      for (const possiblePath of possiblePaths) {
        if (
          fs.existsSync(possiblePath) ||
          fs.existsSync(possiblePath + ".js")
        ) {
          svgPathdataPath = possiblePath;
          break;
        }
      }
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      raf: path.resolve(__dirname, "src/lib/raf-polyfill.js"),
      rgbcolor: path.resolve(__dirname, "src/lib/rgbcolor-polyfill.js"),
      "stackblur-canvas": path.resolve(
        __dirname,
        "src/lib/stackblur-polyfill.js"
      ),
    };

    if (
      fs.existsSync(svgPathdataPath) ||
      fs.existsSync(svgPathdataPath + ".js")
    ) {
      config.resolve.alias["svg-pathdata"] = svgPathdataPath;
    }

    config.resolve.modules = [
      ...(config.resolve.modules || []),
      nodeModulesPath,
      path.resolve(nodeModulesPath, "jspdf", "node_modules"),
      path.resolve(
        nodeModulesPath,
        "jspdf",
        "node_modules",
        "canvg",
        "node_modules"
      ),
    ];

    config.resolve.extensions = [
      ...(config.resolve.extensions || []),
      ".js",
      ".json",
    ];

    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^core-js\/modules\//,
      })
    );

    return config;
  },
};

export default nextConfig;
