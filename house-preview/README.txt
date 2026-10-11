YOUR HOUSE, IN COLOR — PHOTO-SAMPLED EDITION

Open the published page:
https://brendansudol.github.io/exterior-paint-library/house-preview/

Select any of the six paints, then use the appearance arrows, numbered swatches,
or dropdown underneath the house to cycle through photo-sampled variations.
Each sample includes its source photograph, a marked measurement patch,
extracted median RGB, attribution and the source link. Click the source photo
to enlarge it with the sampled patch still marked.

22 photo-sampled appearances across 3 house views (66 deterministic previews):
4 each for Acacia Haze, Evergreen Fog, Retreat, Moody Blue and Dried Thyme.
2 for Studio Blue Green from one builder-attributed project with a documented
palette discrepancy; both are explicitly marked as uncertain evidence.
21 distinct source photos. Earlier AI interpretations are still selectable.

Compare two can show two different paints OR two samples of the same paint.
The URL remembers both selected samples. Swap exchanges paint and sample.
Keyboard: 1-6 paints, left/right paints, [ and ] photo samples in the first pane,
O original, C comparison mode.

house-color-preview-portable.html embeds all 45 assets (house photos, source
photos and masks), CSS, data and scripts. Its core viewer needs no network.
External source links naturally require a connection. Approximately 17.5 MB.

METHOD / LIMITS
Source samples are median RGB values of manually checked body-color patches.
They include lighting, exposure, white balance and any processing already in
the photograph. They are not measured paint reflectances or calibrated colors.
Lighting labels are visual interpretations, not measurements. Some reference
surfaces are stucco, shingles or vertical siding.

One completed AI renovation base is used for each view. Hand-traced siding
masks exclude trim, windows, door, roof and foreground objects. Fine foliage,
railing and tool boundaries are approximate. Linear RGB channel scaling maps
sample RGB to a brighter ordinary siding anchor for that view, retaining the
base shading and texture. Dark shade samples can make the whole preview dark;
this is observed-color transfer, not relighting or prediction of actual paint.
The masks and rendering hold all unmasked image pixels fixed.

samples.json retains sources, RGB values and native pixel bounds.
sample-renderer.js applies the deterministic color transfer in the browser.
build_portable.py recreates the standalone HTML.
Earlier AI inputs and prompts remain in generation-notes.json.

The house photographs and previews in this folder are publicly hosted in the
exterior-paint-library GitHub repository. Only optimized web assets are included;
the original full-resolution uploads and intermediate working files are omitted.
