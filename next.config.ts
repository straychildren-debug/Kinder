import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage — обложки, картинки клубов, файлы сообщений
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // На всякий случай — аватары Google OAuth
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Fallback-аватары Dicebear для админских списков
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      // Placeholder обложки для сид-контента
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
