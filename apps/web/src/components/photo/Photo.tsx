import { images, site } from "@/lib/content";
import type { ComponentPropsWithoutRef } from "react";
import * as s from "./photo.css";

export interface PhotoProps extends Omit<
  ComponentPropsWithoutRef<"img">,
  "src" | "alt" | "width" | "height"
> {
  /** content/cats.toml の写真の id */
  id: string;
  /** 表示する幅の目安。srcset から選ぶのに使う */
  sizes: string;
}

/** 猫の写真。AVIF と WebP を出し分け、幅と高さを付けてレイアウトがずれないようにする。 */
export function Photo({ id, sizes, loading = "lazy", ...rest }: PhotoProps) {
  const image = images()[id];
  const photo = site().cats.photos.find((p) => p.id === id);
  if (!image || !photo) {
    throw new Error(`写真 ${id} がありません`);
  }
  return (
    <picture className={s.picture}>
      <source type="image/avif" srcSet={image.avif} sizes={sizes} />
      <source type="image/webp" srcSet={image.webp} sizes={sizes} />
      <img
        src={image.src}
        alt={photo.alt}
        width={image.width}
        height={image.height}
        loading={loading}
        decoding="async"
        {...rest}
      />
    </picture>
  );
}
