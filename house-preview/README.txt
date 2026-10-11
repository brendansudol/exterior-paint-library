YOUR HOUSE, IN COLOR — CONSISTENT BASELINES

https://brendansudol.github.io/exterior-paint-library/house-preview/

Six manufacturer digital colors × three house views × three shared lighting
settings. Every named paint has one baseline. Switching real-house references
never changes the house preview. Compare mode uses the same lighting on both
sides; choosing the same paint on both sides gives the same image.

Neutral baseline is the default, including for old va/vb photo-sample links.
Warm daylight and Cool shade are modest, illustrative siding-only adjustments.
They retain existing shadows and do not simulate new weather or a time of day.
The original-photo view is unchanged by the lighting control.

COLOR MODEL
palette.json records RGB values and current official source URLs, verified
October 11, 2026 from the color pages' ItemPage structured data. palette.js
makes the data available without a network fetch in the offline edition.

The model decodes the fixed renovation image into linear sRGB and reduces
siding RGB to one luminance value per pixel, discarding its original hue.
Luminance divided by the view's existing brighter-siding anchor gives a scalar
shading field, reused across every paint. Manufacturer RGB is linearized,
multiplied by this scalar, then encoded back to sRGB. Mask-edge blending
preserves surrounding objects; all fully unmasked pixels stay identical.

Warm daylight: +0.3 stop; RGB illuminant gains [1.035, 1, 0.96].
Cool shade: -0.3 stop; gains [0.96, 1, 1.045].
Each illuminant is normalized to unit luminance. These are chosen display
adjustments, not measured illuminants or spectral paint reflectances.
Neutral baseline: no additional tint or exposure adjustment.

The same AI renovation base is used for all colors in each view. Masks are
approximate at fine foliage, tools and railings. Physical paint, screen color
management and real daylight may differ. Confirm finalists on painted siding.

REFERENCES
21 photographs provide 22 annotated references. Their recorded sample colors
are explanatory only and never enter the renderer. Studio Blue Green's two
reference views have an unresolved palette discrepancy, labeled in the UI;
its house preview uses the verified manufacturer RGB like the other paints.

KEYBOARD AND LINKS
1–6 / left-right: paint. [ / ]: reference photo. O: original. C: compare.
URL keys: view, a, b, mode, light, ra, rb, original. Legacy va/vb keys migrate
to reference selections, with neutral lighting unless light is specified.

OFFLINE
python3 house-preview/build_portable.py (from repository root)
The portable HTML embeds 30 assets: 3 fixed renovation bases, 3 originals,
21 references and 3 masks. All renderer scripts, palettes and styles are
embedded. Source links and library navigation require the internet.
Earlier generated images remain in the repository as prior studies.

PUBLICATION
The optimized house photos and simulations are publicly hosted in this repo.
Full-resolution personal uploads and intermediate working files are omitted.
