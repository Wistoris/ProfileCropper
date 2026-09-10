# Profile Pic Maker

A single-page web app for turning any image into a cropped profile picture. Bring
an image in, position a circle or square mask over a rotated preview, watch a live
crop update, and download a ready-to-use PNG. Everything runs in the browser: there
is no backend, and nothing is uploaded or persisted.

## Features

- **Upload an image** via the file picker or by dragging and dropping a file onto
  the app.
- **Paste from clipboard** — copy an image anywhere and press Ctrl/Cmd+V to bring
  it in.
- **Mask crop** — drag a circle or square mask over the image and resize it with
  the eight handles to choose exactly what gets cropped.
- **Rotate** the image from 0 to 360 degrees with the rotation slider.
- **Live preview** — a 200×200 preview shows the final crop in real time as you
  move the mask or rotate.
- **Download PNG** — export a 512×512 PNG (`profile.png`) clipped to the mask
  shape.

## Getting started

You can use the tool [Here](https://wistoris.github.io/profile-pic-maker/)

Or you can build and run it locally by following the below:
Requires Node.js 22+.

```sh
npm install     # install dependencies
npm run dev     # start the Vite dev server
```

`npm run lint` runs Oxlint over the source.

## How it works

The image is kept as a data URL in `App` state and rendered through one shared
transform (letterbox to fit the square, translate to center, rotate about the
center). The editor, the live preview, and the downloaded PNG all use that same
transform and the same mask-to-source-rectangle mapping, so what you see on screen
is what you download.

## Note on rotation and the mask

The image is letterboxed to fit the canvas and then rotated. At non-square rotation
angles (anything other than 0/90/180/270 degrees), the rotated image no longer
fills the square canvas, so the corners become empty transparent area. If the mask
extends past the rotated image into that empty area, the crop (and therefore the
preview and downloaded PNG) will include blank transparent regions. This is expected
behavior for the letterbox-then-rotate design: keep the mask within the visible
image bounds when rotating to avoid capturing empty space.
