import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildDoctor — Your CI/CD pipeline's best diagnostician",
  description:
    "Turn failed builds into clear fixes. BuildDoctor analyzes CI/CD logs, finds root causes, and helps your team ship with confidence.",
  applicationName: "BuildDoctor",
  keywords: ["CI/CD", "DevOps", "build failures", "developer tools", "log analysis"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}