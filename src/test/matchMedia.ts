// jsdom has no matchMedia. Width queries such as "(width < 48rem)" follow window.innerWidth,
// so a test sets the viewport with `window.innerWidth = 390`; other queries never match.
if (typeof window !== "undefined" && !window.matchMedia) {
  const matches = (query: string) => {
    const width = /^\(width (<|>=) ([\d.]+)rem\)$/.exec(query);
    if (!width) return false;
    const breakpoint = Number(width[2]) * 16;
    return width[1] === "<" ? window.innerWidth < breakpoint : window.innerWidth >= breakpoint;
  };
  window.matchMedia = (query) =>
    ({
      media: query,
      get matches() {
        return matches(query);
      },
      addEventListener() {},
      removeEventListener() {},
    }) as unknown as MediaQueryList;
}
