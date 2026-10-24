type Callback = () => void;

const callbacks = new WeakMap<Element, Callback>();
let observer: IntersectionObserver | undefined;

/** 全部の要素で1つのIntersectionObserverを使う。しきい値と余白はモックと同じ。 */
function shared(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const callback = callbacks.get(entry.target);
        callbacks.delete(entry.target);
        observer?.unobserve(entry.target);
        callback?.();
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );
  return observer;
}

/** 要素が画面に入ったら1回だけ`callback`を呼び、そのあとは監視をやめる。 */
export function observeOnce(el: Element, callback: Callback): () => void {
  callbacks.set(el, callback);
  shared().observe(el);
  return () => {
    callbacks.delete(el);
    observer?.unobserve(el);
  };
}

export function reducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
