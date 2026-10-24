import { readFileSync } from "node:fs";
import path from "node:path";
import { Reveal } from "@/components/reveal/Reveal";
import * as s from "./stack.css";

/** モックで描いておいた Mermaid の図。ビルド時に描くのは #70 */
export type DiagramName = "arch" | "admin" | "deploy";

function svg(name: DiagramName): string {
  const file = path.join(
    process.cwd(),
    "src/components/stack/diagrams",
    `${name}.svg`,
  );
  return readFileSync(file, "utf8");
}

export function Diagram({ name }: { name: DiagramName }) {
  return (
    <Reveal
      as="figure"
      className={s.mmd}
      dangerouslySetInnerHTML={{ __html: svg(name) }}
    />
  );
}
