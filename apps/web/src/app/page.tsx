import { Mosaic } from "@/components/mosaic/Mosaic";
import { site } from "@/lib/content";

export default function Home() {
  return (
    <section aria-labelledby="h-name">
      <Mosaic />
      <h1 id="h-name">{site().profile.name}</h1>
    </section>
  );
}
