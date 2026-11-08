import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import axios from 'axios';
import { generateApi } from 'swagger-typescript-api';

// API_SCHEMA_URL=http://localhost:8080/swagger/doc.json npm run generate-api
const schemaPath = resolve('src/api/swagger.json');
const schema = process.env.API_SCHEMA_URL
  ? (await axios.get(process.env.API_SCHEMA_URL, { timeout: 15000 })).data
  : JSON.parse(await readFile(schemaPath, 'utf8'));

const names = {
  'get /tariffs': 'getTariffs', 'post /tariffs': 'createTariff',
  'get /tariffs/feed': 'getTariffFeed', 'get /tariffs/draft': 'getTariffDraft',
  'put /tariffs/{id}/publication': 'publishTariff',
  'delete /tariffs/{id}': 'deleteTariff', 'post /tariffs/{id}/likes': 'setTariffLike',
  'post /users': 'registerTariffUser', 'post /users/login': 'loginTariffUser',
  'post /users/logout': 'logoutTariffUser',
};
for (const [path, operations] of Object.entries(schema.paths)) {
  for (const [method, operation] of Object.entries(operations)) {
    if (names[`${method} ${path}`]) operation.operationId = names[`${method} ${path}`];
  }
}
await mkdir(resolve('src/api/generated'), { recursive: true });
if (process.env.API_SCHEMA_URL) await writeFile(schemaPath, JSON.stringify(schema, null, 2) + '\n');
await generateApi({
  spec: schema, fileName: 'TariffsApi.ts', output: resolve('src/api/generated'),
  httpClientType: 'axios', apiClassName: 'TariffsApi',
});
