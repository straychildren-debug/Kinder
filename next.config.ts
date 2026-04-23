import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dicebear и резервные SVG-аватары возвращают SVG — разрешаем с жёстким CSP,
    // чтобы Next.js Image оптимизатор не ругался.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
      // Реальные обложки книг (OpenLibrary)
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      // Реальные постеры фильмов и обложки книг (Wikipedia / Wikimedia Commons)
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/supabase/:path*',
        destination: 'https://rreomovpzlbzxmxkmebr.supabase.co/:path*',
      },
    ];
  },
};

export default nextConfig;
