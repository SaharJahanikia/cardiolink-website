"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/local-accounts";

export default function DemoVideoClient() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (getCurrentUser()) {
      setAllowed(true);
    } else {
      router.replace("/account/sign-in?next=/demo-video");
    }
  }, [router]);

  if (!allowed) {
    return <main style={{ padding: 48 }}>Checking demo access…</main>;
  }

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
