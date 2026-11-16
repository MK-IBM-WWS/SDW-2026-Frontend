#!/usr/bin/env python3
"""Pinned public CLIP assets. Complete downloads atomically; partial files are never used."""
import hashlib
import json
from pathlib import Path
import time
from urllib.request import Request, urlopen
MODEL='Xenova/clip-vit-base-patch32'
REVISION='6b7c523703ae26e39be4b03774966f8571c7f523'
FILES=['config.json','tokenizer.json','tokenizer_config.json','preprocessor_config.json','vocab.json','merges.txt','onnx/text_model_quantized.onnx','onnx/vision_model_quantized.onnx']
root=Path(__file__).resolve().parents[1]/'native-public/models'/MODEL
root.mkdir(parents=True,exist_ok=True)
manifest_path=root/'download-manifest.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
for name in FILES:
 path=root/name
 if path.exists() and manifest.get('revision')==REVISION and manifest.get('sha256',{}).get(name)==hashlib.sha256(path.read_bytes()).hexdigest():
  print(f'Already verified: {name}',flush=True);continue
 path.parent.mkdir(parents=True,exist_ok=True)
 for attempt in range(3):
  try:
   print(f'Downloading {name}',flush=True)
   req=Request(f'https://huggingface.co/{MODEL}/resolve/{REVISION}/{name}',headers={'User-Agent':'CloudTariffsLab/1.0'})
   with urlopen(req,timeout=180) as response, path.with_suffix(path.suffix+'.partial').open('wb') as out:
    digest=hashlib.sha256();size=0
    while chunk:=response.read(1024*1024):out.write(chunk);digest.update(chunk);size+=len(chunk)
    declared=response.headers.get('Content-Length')
    if declared and int(declared)!=size:raise RuntimeError('Incomplete download')
    if name.endswith('.onnx') and size<1000000:raise RuntimeError('Invalid ONNX file size')
   path.with_suffix(path.suffix+'.partial').replace(path)
   manifest['revision']=REVISION;manifest.setdefault('sha256',{})[name]=digest.hexdigest()
   manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
   break
  except Exception:
   if attempt==2:raise
   time.sleep(2)
print('CLIP is ready. Run npm run native:build.',flush=True)
