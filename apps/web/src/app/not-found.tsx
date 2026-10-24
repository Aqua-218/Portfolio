import { Lost } from "@/components/lost/Lost";

export default function NotFound() {
  return (
    <Lost
      code="404"
      message="このページは見つかりませんでした。猫も迷子になっちゃったみたい。"
    />
  );
}
