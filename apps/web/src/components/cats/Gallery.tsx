"use client";

import type { Image } from "@portfolio/content-types";
import { useRef, useState, type ReactNode } from "react";
import * as s from "./cats.css";

export interface GalleryPhoto {
  id: string;
  alt: string;
  image: Image;
}

/** ギャラリーの写真を押すと、大きく見られる。クリックかEscで閉じる。 */
export function Gallery({
  photos,
  children,
}: {
  photos: readonly GalleryPhoto[];
  children: ReactNode[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<GalleryPhoto | undefined>(undefined);

  const open = (p: GalleryPhoto) => {
    setShown(p);
    dialog.current?.showModal();
  };

  return (
    <>
      <div className={s.gallery}>
        {photos.map((p, i) => (
          <figure key={p.id} className={s.figure}>
            <button
              type="button"
              className={s.open}
              aria-label="写真を大きく見る"
              onClick={() => {
                open(p);
              }}
            >
              {children[i]}
            </button>
          </figure>
        ))}
      </div>
      <dialog
        ref={dialog}
        className={s.dialog}
        onClose={() => {
          setShown(undefined);
        }}
      >
        {shown && (
          <picture>
            <source type="image/avif" srcSet={shown.image.avif} sizes="92vw" />
            <source type="image/webp" srcSet={shown.image.webp} sizes="92vw" />
            <img
              src={shown.image.src}
              alt={shown.alt}
              width={shown.image.width}
              height={shown.image.height}
            />
          </picture>
        )}
        <button
          type="button"
          className={s.close}
          aria-label="閉じる"
          onClick={() => {
            dialog.current?.close();
          }}
        />
      </dialog>
    </>
  );
}
