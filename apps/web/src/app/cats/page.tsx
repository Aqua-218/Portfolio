import { Gallery } from "@/components/cats/Gallery";
import * as c from "@/components/cats/cats.css";
import { Photo } from "@/components/photo/Photo";
import { Reveal } from "@/components/reveal/Reveal";
import * as s from "@/components/section/section.css";
import { images, site } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("cats");

export default function Cats() {
  const photos = site().cats.photos.flatMap((p) => {
    const image = images()[p.id];
    return image ? [{ id: p.id, alt: p.alt, image }] : [];
  });
  return (
    <section className={c.section} aria-labelledby="h-cats">
      <div className={c.head}>
        <Reveal>
          <h2 className={s.heading} id="h-cats">
            Cats
          </h2>
          <p className={s.subtitle}>猫たち</p>
        </Reveal>
        <Reveal as="p" delay={0.08}>
          黒猫、三毛、キジ白。
        </Reveal>
      </div>
      <Gallery photos={photos}>
        {photos.map((p, i) => (
          <Reveal key={p.id} kind="pop" delay={0.1 + i * 0.06}>
            <Photo id={p.id} sizes="(max-width: 700px) 50vw, 33vw" />
          </Reveal>
        ))}
      </Gallery>
    </section>
  );
}
