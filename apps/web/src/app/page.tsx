import { site } from "@/lib/content";

export default function Home() {
  return <h1>{site().profile.name}</h1>;
}
