import type { Metadata } from "next";
import DemoVideoClient from "./DemoVideoClient";

export const metadata: Metadata = {
  title: "Watch the demo – CardioLink",
};

export default function DemoVideoPage() {
  return <DemoVideoClient />;
}
