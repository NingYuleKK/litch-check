import type { Express } from "express";
import https from "https";
import http from "http";

/**
 * Image proxy endpoint: GET /api/proxy-image?url=<encoded_url>
 *
 * Fetches an external image server-side and pipes it back to the client
 * with proper CORS headers. This allows the frontend to load CDN images
 * without CORS restrictions when exporting to canvas/PNG.
 *
 * Only allows fetching from trusted domains (manuscdn.com, etc.)
 */

const ALLOWED_HOSTS = [
  "files.manuscdn.com",
  "manuscdn.com",
  "cdn.manus.im",
  "images.manus.im",
];

function isAllowedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return ALLOWED_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

export function registerImageProxyRoute(app: Express) {
  app.get("/api/proxy-image", (req, res) => {
    const urlStr = req.query.url as string;

    if (!urlStr) {
      res.status(400).json({ error: "Missing url parameter" });
      return;
    }

    if (!isAllowedUrl(urlStr)) {
      res.status(403).json({ error: "URL not allowed" });
      return;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlStr);
    } catch {
      res.status(400).json({ error: "Invalid URL" });
      return;
    }

    const protocol = parsedUrl.protocol === "https:" ? https : http;

    const proxyReq = protocol.get(urlStr, (proxyRes) => {
      const contentType = proxyRes.headers["content-type"] || "image/png";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");

      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error("[ImageProxy] Fetch error:", err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: "Failed to fetch image" });
      }
    });

    proxyReq.setTimeout(10000, () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: "Image fetch timeout" });
      }
    });
  });
}
