import { useEffect, useState } from "react";

export default function useMediaQuery(query: string): boolean {
  const init = () => (typeof window === "undefined" ? false : window.matchMedia(query).matches);
  const [matches, setMatches] = useState<boolean>(init());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);

    const handleEvent = (e: MediaQueryListEvent) => setMatches(e.matches);
    const update = () => setMatches(mql.matches);

    update();

    if ("addEventListener" in mql) {
      mql.addEventListener("change", handleEvent);
      return () => mql.removeEventListener("change", handleEvent);
    } else {
      // @ts-ignore - addListener exists on older browsers
      mql.addListener(update);
      // @ts-ignore - removeListener exists on older browsers
      return () => mql.removeListener(update);
    }
  }, [query]);

  return matches;
}
