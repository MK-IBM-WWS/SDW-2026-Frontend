/// <reference lib="webworker" />
import { env, AutoTokenizer, AutoProcessor, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage } from '@huggingface/transformers';
import { MODEL_ID, validDescription } from './search';
import type { NativeTariff } from './types';

// Only the two encoders and text/image preprocessing run here; the API sends no vectors.
env.allowRemoteModels = false;
env.allowLocalModels = true;
env.useBrowserCache = false;
env.backends.onnx.wasm!.numThreads = 1;
env.backends.onnx.wasm!.proxy = false;
const scope = self as unknown as DedicatedWorkerGlobalScope;
function createModels() {
 const options = { device: 'wasm', dtype: 'q8' } as const;
 return Promise.all([
  AutoTokenizer.from_pretrained(MODEL_ID), AutoProcessor.from_pretrained(MODEL_ID),
  CLIPTextModelWithProjection.from_pretrained(MODEL_ID, options),
  CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, options),
 ]);
}
let models: ReturnType<typeof createModels> | null = null;
const textCache = new Map<string, number[]>();

let cachedImage: {id:number;vector:number[]} | null = null;
let queue = Promise.resolve();
interface SearchMessage { requestId: number; items: NativeTariff[]; file: File; fileId: number; modelBase: string; wasmBase: string }
scope.onmessage = (event: MessageEvent<SearchMessage>) => {
 const message = event.data;
 queue = queue.then(async () => {
  const { requestId, items, file, fileId, modelBase, wasmBase } = message;
  const send = (type: string, data: unknown) => scope.postMessage({ requestId, type, data });
  try {
   env.localModelPath = modelBase;
   env.backends.onnx.wasm!.wasmPaths = wasmBase;
   send('status', 'Загрузка локальной модели CLIP…');
   models ??= createModels();
   const [tokenizer, processor, textModel, visionModel] = await models;
   const eligible = items.filter(item => validDescription(item.short_description));
   const vectors: Record<number, number[]> = {};
   // Cache key includes the actual description: DB edits must invalidate its embedding.
   const missing = eligible.filter(item => !textCache.has(item.short_description));
   for (let start = 0; start < missing.length; start += 8) {
    const batch = missing.slice(start, start+8);
    const inputs = tokenizer(batch.map(item => item.short_description), { padding: true, truncation: true });
    const { text_embeds } = await textModel(inputs);
    const dimension = text_embeds.dims[1];
    batch.forEach((item, i) => textCache.set(item.short_description,
     Array.from(text_embeds.data.slice(i*dimension, (i+1)*dimension), Number)));
    send('status', `Описания: ${Math.min(start+8,missing.length)} / ${missing.length}`);
   }
   eligible.forEach(item => { vectors[item.tariff_id] = textCache.get(item.short_description)!; });
   if (!cachedImage || cachedImage.id !== fileId) {
    send('status', 'Обработка изображения…');
    const url = URL.createObjectURL(file);
    try {
     const raw = await RawImage.read(url);
     const { image_embeds } = await visionModel(await processor(raw));
     cachedImage = {id:fileId,vector:Array.from(image_embeds.data,Number)};
    } finally { URL.revokeObjectURL(url); }
   }
   send('result', { vectors, image: cachedImage.vector, eligible: eligible.length });
  } catch (error) {
   models = null;
   send('error', error instanceof Error ? error.message : String(error));
  }
 }).catch(error => scope.postMessage({ requestId: message.requestId, type: 'error', data: String(error) }));
};
