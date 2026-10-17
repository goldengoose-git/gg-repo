/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le immagini dei template/asset arrivano da domini esterni (Unsplash,
  // CDN Golden Goose, ecc.). Se vuoi usare next/image aggiungi qui i domini;
  // per ora usiamo <img> normali, quindi non serve whitelistarli.
  images: { unoptimized: true },
};

export default nextConfig;
