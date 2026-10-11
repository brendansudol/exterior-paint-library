"""Package the local viewer with every preview and original embedded."""
from pathlib import Path
import base64
import json

ROOT = Path(__file__).resolve().parent
assets = {}
for folder in ('images', 'originals', 'references', 'masks'):
    for path in sorted((ROOT / folder).glob('*')):
        if path.suffix not in ('.webp','.png'): continue
        mime = 'image/png' if path.suffix == '.png' else 'image/webp'
        assets[str(path.relative_to(ROOT))] = 'data:'+mime+';base64,' + base64.b64encode(path.read_bytes()).decode()
assert len(assets) == 45, f'Expected 21 house photos, 21 source photos and 3 masks, found {len(assets)}'
html = (ROOT / 'index.html').read_text()
html = html.replace('href="../"', 'href="https://brendansudol.github.io/exterior-paint-library/"').replace('href="../library/"', 'href="https://brendansudol.github.io/exterior-paint-library/library/"')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (ROOT / 'style.css').read_text() + '</style>')
html = html.replace('src="images/front-acacia-haze.webp"', 'src="' + assets['images/front-acacia-haze.webp'] + '"')
html = html.replace('href="./" aria-label="House color studio home"', 'href="?" aria-label="House color studio home"')
notes = 'data:application/json;base64,' + base64.b64encode((ROOT / 'generation-notes.json').read_bytes()).decode()
html = html.replace('href="generation-notes.json" download', 'href="' + notes + '" download="generation-notes.json"')
html = html.replace('<a href="house-color-preview-portable.html" download>Save the complete offline viewer ↓</a>', '<span>Offline edition · All house and reference photos included</span>')
sample_notes = 'data:application/json;base64,' + base64.b64encode((ROOT / 'samples.json').read_bytes()).decode()
html = html.replace('href="samples.json" download', 'href="' + sample_notes + '" download="samples.json"')
for name in ('samples.js','sample-renderer.js'):
    html = html.replace('<script src="'+name+'"></script>', '<script>'+(ROOT/name).read_text()+'</script>')
script = '<script>window.HOUSE_ASSETS=' + json.dumps(assets) + ';</script>\n<script>' + (ROOT / 'app.js').read_text() + '</script>'
html = html.replace('<script src="app.js"></script>', script)
output = ROOT / 'house-color-preview-portable.html'
output.write_text(html)
print(f'{output.name}: {output.stat().st_size / 1024**2:.1f} MB; 18 earlier previews + 3 originals + 21 references + 3 masks')
