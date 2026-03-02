# fumux

convert your files. ~~convert your friends.~~ **help your friends convert their files.**

## What is it good for?

- running your favorite `ffmpeg` commands on the go
- audio/video processing beyond just "re-encode into a different container"
- helping people with converting their files too

ffmpeg under the hood, with WASM, so it all runs in your browser.

[vert](https://vert.sh) is recommended if you want something simpler or don't know
how to use the `ffmpeg` CLI.

to use it, go to **[penguinencounter.github.io/fumux-prod](https://penguinencounter.github.io/fumux-prod)**
(canary deployments are [also available](https://penguinencounter.github.io/fumux-prod/dev))

## Development

this project is based on JSPM (which uses modern standards to make
imports not suck.) unfortunately JSPM also kinda sucks so there's a
couple of bash scripts involved to tie things together:
- `vendor-it` copies a bunch of `node-modules` into the gitignored `vendor` directory.
  the website references these resources mainly because they can't be easily
  rollup'd (ex. the wasm modules and worker scripts)
- `patchwork` messes with libraries and generates a manifest for distribution builds.

to run:
```bash
pnpm dev
```

to build a static website in `dist`:
```bash
pnpm build
```
