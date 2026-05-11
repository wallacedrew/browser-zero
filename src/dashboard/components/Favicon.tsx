import { useState } from 'react';

interface Props {
  favIconUrl: string | null;
}

export function Favicon({ favIconUrl }: Props) {
  // Some favicon URLs 404 or fail CORS; once the <img> errors, drop back to
  // the placeholder so the row never shows a broken-image glyph.
  const [errored, setErrored] = useState(false);

  if (favIconUrl === null || errored) {
    return (
      <span
        data-testid="favicon-placeholder"
        aria-hidden="true"
        className="block h-4 w-4 shrink-0 rounded-sm bg-slate-200"
      />
    );
  }

  return (
    <img
      data-testid="tab-favicon"
      src={favIconUrl}
      alt=""
      aria-hidden="true"
      width={16}
      height={16}
      onError={() => {
        setErrored(true);
      }}
      className="h-4 w-4 shrink-0 rounded-sm"
    />
  );
}
