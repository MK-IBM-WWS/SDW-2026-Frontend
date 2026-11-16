import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
const path='node_modules/onnxruntime-web/dist';
mkdirSync('native-public/ort',{recursive:true});
for(const name of readdirSync(path)) if(name.startsWith('ort-wasm')&&(name.endsWith('.wasm')||name.endsWith('.mjs'))) cpSync(`${path}/${name}`,`native-public/ort/${name}`);
const files=['config.json','tokenizer.json','tokenizer_config.json','preprocessor_config.json','onnx/text_model_quantized.onnx','onnx/vision_model_quantized.onnx'];
const missing=files.filter(name=>!existsSync(`native-public/models/Xenova/clip-vit-base-patch32/${name}`));
if(missing.length){console.error('Не подготовлена локальная модель. Выполните npm run models:download.\n'+missing.join('\n'));process.exit(1);}
console.log('Локальные CLIP и WASM готовы.');
