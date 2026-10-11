# The Exterior Paint Library

A static, sourced visual library of real house exteriors in six Sherwin-Williams colors: Acacia Haze, Evergreen Fog, Retreat, Moody Blue, Dried Thyme and Studio Blue Green.

**245 image assets**, including **164 body/siding views**. Counts represent images, not houses. Each project retains its original source links, credits, paint palette and color evidence. Source-confirmed body photos, secondary attributions, exterior accents, uncertain examples and painted samples remain distinct.

## Browse

- Website: https://brendansudol.github.io/exterior-paint-library/
- Six color collections, cross-color search and category filters
- [House color studio](https://brendansudol.github.io/exterior-paint-library/house-preview/): six paints, three house views, shared illustrative lighting and one manufacturer-based color baseline per paint; includes real-house references and an offline download
- Full-size image viewer with keyboard navigation and source details
- Browser-local saved-photo shortlist (no account, analytics or backend)
- Original research galleries and source manifests under `research/`

## Local development

No package installation or framework build is required. Serve this directory over HTTP:

```sh
python3 -m http.server 8766
```

Open http://localhost:8766. HTML pages are generated from `data/library.json`:

```sh
python3 scripts/build.py
```

To import the original six research collections, provide their shared output directory. The importer requires Google's `cwebp` CLI for display thumbnails:

```sh
python3 scripts/import_collections.py /absolute/path/to/research-outputs
python3 scripts/build.py
```

The standalone house viewer lives in `house-preview/`. Its assets are served directly; to rebuild its self-contained offline edition after changes, run:

```sh
python3 house-preview/build_portable.py
```

Original downloaded images remain byte-for-byte intact in `research/<color>/photos/`. Optimized WebP thumbnails live in `assets/thumbs/`.

## GitHub Pages

Publish from the `main` branch, `/(root)` folder. `.nojekyll` enables static-file serving. Future pushes to `main` publish the updated files. All URLs are relative so the site works under the repository's Pages path.

## Sources and image rights

This is an independent research collection, not a Sherwin-Williams publication. Swatches are approximate. Photos belong to their respective creators; this repository does not grant a license to reuse them. Source manifests preserve evidence and SHA-256 checksums. The research photographs were not recolored. The separate house color studio includes clearly labeled AI renovation concepts and deterministic recoloring based on manufacturer digital references and a shared neutral shading model. These are approximate, not calibrated paint predictions. The included house photographs and simulations are publicly accessible. Research was conducted October 8–9, 2026.
