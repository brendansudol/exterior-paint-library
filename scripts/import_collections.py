#!/usr/bin/env python3
"""Import the six existing research collections. Usage: python3 scripts/import_collections.py /path/to/outputs"""
from pathlib import Path
import concurrent.futures, hashlib, json, shutil, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv[1]).resolve()
COLORS=[
 ('acacia-haze','Acacia Haze','SW 9132','#969c92','A soft gray-green, seen in sunshine and shade.','pink-coat-01'),
 ('evergreen-fog','Evergreen Fog','SW 9130','#95978a','Muted green with an earthy, quiet character.','hill-blaine-01'),
 ('retreat','Retreat','SW 6207','#7a8076','A deeper green-gray for a grounded exterior.','paintcorps-01'),
 ('moody-blue','Moody Blue','SW 6221','#7a9192','A blue-green that shifts with the light.','grant-park-01'),
 ('dried-thyme','Dried Thyme','SW 6186','#7b8070','An herbal green alongside wood, stone and white.','hilltop-01'),
 ('studio-blue-green','Studio Blue Green','SW 0047','#6d817b','A historic blue-green on porches and siding.','old-drake-02'),
]
library=dict(title='The Exterior Paint Library',updated='2026-10-09',colors=[])
tasks=[]
for slug,name,code,hexcolor,description,hero in COLORS:
 source=SOURCE if slug=='acacia-haze' else SOURCE/slug
 d=json.loads((source/'sources.json').read_text()); dest=ROOT/'research'/slug;dest.mkdir(parents=True,exist_ok=True)
 for file in ['sources.json','READ-ME.txt',slug+'-exterior-photos.html']:shutil.copy2(source/file,dest/file)
 color=dict(slug=slug,name=name,code=code,swatch=hexcolor,description=description,hero=hero,**{k:d[k] for k in ['groups','methodology','exclusions','research_date']})
 color['counts']={cat:sum(len(g['photos']) for g in d['groups'] if g['category']==cat) for cat in ['confirmed','attributed','accents','uncertain','samples']}
 color['total']=sum(color['counts'].values());color['body_count']=color['counts']['confirmed']+color['counts']['attributed']
 for g in color['groups']:
  for p in g['photos']:
   src=source/p['file'];dst=dest/p['file'];dst.parent.mkdir(parents=True,exist_ok=True)
   assert hashlib.sha256(src.read_bytes()).hexdigest()==p['sha256']
   shutil.copy2(src,dst)
   p['file']=str(dst.relative_to(ROOT));p['thumb']=f'assets/thumbs/{slug}/{p["id"]}.webp'
   tasks.append((src,ROOT/p['thumb']))
 library['colors'].append(color)
(ROOT/'data').mkdir(exist_ok=True)
(ROOT/'data/library.json').write_text(json.dumps(library,ensure_ascii=False,indent=2))
def thumbnail(task):
 src,dst=task;dst.parent.mkdir(parents=True,exist_ok=True)
 if not dst.exists():subprocess.run(['cwebp','-quiet','-q','84','-resize','680','0',str(src),'-o',str(dst)],check=True,capture_output=True)
 return dst
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(thumbnail,tasks))
print(f'Imported {len(tasks)} original images and {len(COLORS)} research pages. Created optimized display thumbnails.')
