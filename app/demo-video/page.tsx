import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Watch the demo – CardioLink" };

export default function DemoVideoPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ marginBottom: 24 }}>See CardioLink in action</h1>
      <video
        controls
        playsInline
        preload="metadata"
        style={{ width: "100%", borderRadius: 12, background: "#000" }}
      >
        <source src="/CardioLink%20Demo.mp4" type="video/mp4" />
        Your browser can't play this video.
      </video>
      <p style={{ marginTop: 24 }}>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
