// Deterministic seedable PRNG (mulberry32)
export function makeRng(seed: number) {
  let s = seed >>> 0;
  function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    range(min: number, max: number) {
      return min + next() * (max - min);
    },
    int(min: number, max: number) {
      return Math.floor(min + next() * (max - min + 1));
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)]!;
    },
    weighted<T>(items: readonly { item: T; weight: number }[]): T {
      const total = items.reduce((s, i) => s + i.weight, 0);
      let r = next() * total;
      for (const it of items) {
        r -= it.weight;
        if (r <= 0) return it.item;
      }
      return items[items.length - 1]!.item;
    },
    chance(p: number) {
      return next() < p;
    },
    shuffle<T>(arr: T[]): T[] {
      const out = [...arr];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
  };
}

export type Rng = ReturnType<typeof makeRng>;
