import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/nova-home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/nova-home-teste",
        destination: "/",
        permanent: true,
      },
      {
        source: "/nova-login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/nova-register",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/nova-admin",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/teste",
        destination: "/",
        permanent: true,
      },
      {
        source: "/teste/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/teste/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/teste/register",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/teste/admin",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/ai-coach",
        destination: "/trainings/ai",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
