export const AppVersion = () =>
  process.env.APP_VERSION ? (
    <span
      aria-label={`Application version ${process.env.APP_VERSION}`}
      className="text-ink-subtle shrink-0 text-xs whitespace-nowrap tabular-nums"
    >
      v{process.env.APP_VERSION}
    </span>
  ) : null;
