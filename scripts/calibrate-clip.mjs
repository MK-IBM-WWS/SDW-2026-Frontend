// Usage: node scripts/calibrate-clip.mjs BACKEND_FOLDER [IMAGE_FOLDER] [OUTPUT_PREFIX]
// Images named cat.jpg, dog.jpg, ... have ten relevant CLIP-<category>-* seed records.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { env, AutoTokenizer, AutoProcessor, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage } from '@huggingface/transformers';
const [backendArg,imagesArg,outArg='docs/clip-calibration']=process.argv.slice(2);
if(!backendArg) throw new Error('Usage: node scripts/calibrate-clip.mjs BACKEND_FOLDER [IMAGE_FOLDER] [OUTPUT_PREFIX]');
const backend=resolve(backendArg),images=resolve(imagesArg||`${backend}/test-images`),out=resolve(outArg);
const records=JSON.parse(readFileSync(`${backend}/cmd/seed-clip/records.json`));
env.allowRemoteModels=false;env.allowLocalModels=true;env.localModelPath=resolve('native-public/models')+'/';
const id='Xenova/clip-vit-base-patch32', options={dtype:'q8',device:'cpu'};
const tokenizer=await AutoTokenizer.from_pretrained(id),processor=await AutoProcessor.from_pretrained(id);
const text=await CLIPTextModelWithProjection.from_pretrained(id,options),vision=await CLIPVisionModelWithProjection.from_pretrained(id,options);
const vectors=[];
for(let i=0;i<records.length;i+=8){
 const batch=records.slice(i,i+8);
 const {text_embeds}=await text(tokenizer(batch.map(row=>row.short_description),{padding:true,truncation:true}));
 const dim=text_embeds.dims[1];for(let j=0;j<batch.length;j++)vectors.push(Array.from(text_embeds.data.slice(j*dim,(j+1)*dim)));
}
const cosine=(a,b)=>{let dot=0,na=0,nb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}return dot/Math.sqrt(na*nb);};
const categories=[...new Set(records.map(row=>row.category))],measurements=[],rankings={};
for(const category of categories){
 const path=`${images}/${category}.jpg`;if(!existsSync(path))throw new Error(`Missing test image ${path}`);
 const {image_embeds}=await vision(await processor(await RawImage.read(path)));
 const image=Array.from(image_embeds.data);
 const ranked=records.map((row,i)=>({name:row.tariff_name,category:row.category,cosine:cosine(image,vectors[i]),score:(cosine(image,vectors[i])+1)/2})).sort((a,b)=>b.score-a.score);
 rankings[category]=ranked;
 for(const threshold of [0.4,0.5,0.6,0.7,0.8,0.9])for(const topK of [3,5,10,20]){
  const results=ranked.filter(row=>row.score>=threshold).slice(0,topK),tp=results.filter(row=>row.category===category).length;
  const precision=results.length?tp/results.length:0,recall=tp/10;
  measurements.push({category,threshold,topK,count:results.length,tp,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0});
 }
 console.log(category,ranked[0].score.toFixed(4),ranked[0].name);
}
const summary=[];
for(const threshold of [0.4,0.5,0.6,0.7,0.8,0.9])for(const topK of [3,5,10,20]){
 const rows=measurements.filter(row=>row.threshold===threshold&&row.topK===topK);
 const mean=key=>rows.reduce((sum,row)=>sum+row[key],0)/rows.length;
 summary.push({threshold,topK,precision:mean('precision'),recall:mean('recall'),f1:mean('f1'),coverage:rows.filter(row=>row.count>0).length/rows.length});
}
const best=[...summary].sort((a,b)=>b.f1-a.f1||b.recall-a.recall||a.topK-b.topK||b.threshold-a.threshold)[0];
const result={model:id,revision:'6b7c523703ae26e39be4b03774966f8571c7f523',dtype:'q8',device:'cpu',imageFolder:images,categories,recordCount:records.length,note:'Calibration uses the category photos supplied with the seed. Use separate held-out photos to assess generalization. Scores are explicitly normalized cosine similarities: (cosine + 1) / 2. Raw cosine is also retained.',best,summary,rankings};
mkdirSync(dirname(out),{recursive:true});writeFileSync(out+'.json',JSON.stringify(result,null,2)+'\n');
writeFileSync(out+'.csv','category,threshold,topK,count,tp,precision,recall,f1\n'+measurements.map(row=>Object.values(row).join(',')).join('\n')+'\n');
writeFileSync(out+'.md',`# CLIP: measured baseline\n\n100 descriptions, 10 fixture images, q8 CPU. Normalized score = (cosine + 1) / 2; raw cosines are retained in JSON.\n\nBest in the required grid: threshold **${best.threshold}**, TopK **${best.topK}**. Macro precision ${best.precision.toFixed(3)}, recall ${best.recall.toFixed(3)}, F1 ${best.f1.toFixed(3)}, coverage ${best.coverage.toFixed(3)}.\n\nThis is fixture calibration, not a held-out evaluation. Some relevant photos may have all normalized scores below the chosen threshold; the app correctly returns no matches.\n\n|Threshold|TopK|Macro precision|Macro recall|Macro F1|Coverage|\n|---|---|---|---|---|---|\n`+summary.map(row=>`|${row.threshold}|${row.topK}|${row.precision.toFixed(3)}|${row.recall.toFixed(3)}|${row.f1.toFixed(3)}|${row.coverage.toFixed(3)}|`).join('\n')+'\n');
await text.dispose();await vision.dispose();console.log('Best:',best);
