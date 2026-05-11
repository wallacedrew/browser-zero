# Icon assets

Monogram "b0" — white Arial-Black on a slate-900 (#0F172A) rounded square.

`icon.svg` is the design source. The four PNGs are what `manifest.json` ships
to Chrome (16/32/48 for browser-action surfaces, 128 for the Web Store
listing + extension management page).

## Regenerate the PNGs

```bash
cd src/dashboard/assets
for SIZE in 16 32 48 128; do
  RX=$(awk "BEGIN { print int($SIZE * 22 / 128) }")
  FONTSIZE=$(awk "BEGIN { print int($SIZE * 72 / 128) }")
  magick -size ${SIZE}x${SIZE} xc:none \
    -fill '#0F172A' \
    -draw "roundRectangle 0,0 $((SIZE-1)),$((SIZE-1)) ${RX},${RX}" \
    -font Arial-Black -pointsize "$FONTSIZE" -fill white \
    -gravity center -annotate +0+0 'b0' \
    "icon-${SIZE}.png"
done
```

Requires ImageMagick (`brew install imagemagick`) with macOS's bundled
Arial-Black font visible to fontconfig.
