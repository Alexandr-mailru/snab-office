import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone on LAN + public tunnels for shared testing
  allowedDevOrigins: [
    "192.168.0.2",
    "192.168.0.*",
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.loca.lt",
  ],
};

export default nextConfig;
