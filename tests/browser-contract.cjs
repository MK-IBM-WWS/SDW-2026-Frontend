// Проверка фронтенда через настоящий Vite proxy и HTTP-стенд по контракту ЛР4.
// Это не замена интеграционной проверке с PostgreSQL/Redis/MinIO.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const { createServer } = await import('vite');
  const calls = [], s3Calls = [], errors = [];
  let failStatus = 0, delay = 0, draft = null, nextId = 3, tokenValid = true;
  const tariff = (id, name, owner, price) => ({ tariff_id: id, tariff_name: name,
    short_description: 'Описание облачного тарифа для теста', tariff_status: 'опубликован',
    price_per_month: price, ram_gb: 4, like_count: 0, is_liked: 0, user_id: owner,
    image_url: 'http://localhost:9000/cloud-tariffs/test.jpg?X-Amz-Signature=test&X-Amz-Expires=900',
    video_url: '/static/media/example.mp4' });
  let items = [tariff(1,'API Tariff One',1,400),tariff(2,'API Tariff Two',2,12000)];
  const personalize = (t, auth) => ({...t, is_owner: auth && t.user_id === 1 ? 1 : 0, is_liked: auth ? t.is_liked : 0});
  const backend = http.createServer(async (req,res) => {
    const url = new URL(req.url,'http://localhost');
    let body='';for await(const b of req) body+=b;
    const auth = req.headers.authorization === 'Bearer contract-token' && tokenValid;
    calls.push({method:req.method,path:url.pathname,query:url.search,auth,body,contentType:req.headers['content-type']});
    const reply = (data,status=200) => {res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(status<400?{status:'success',data}:{status:'fail',message:data}));};
    if(delay) await new Promise(r=>setTimeout(r,delay));
    if(failStatus) return reply('Тестовая недоступность сервера',failStatus);
    if(url.pathname==='/api/users/login') {
      const data=JSON.parse(body);
      if(data.login!=='student'||data.password!=='student123')return reply('Неверный логин или пароль',401);
      tokenValid=true;return reply({access_token:'contract-token',user_id:1});
    }
    if(req.method==='GET' && url.pathname==='/api/tariffs')return reply(items.filter(t=>!url.searchParams.has('priceLimit')||t.price_per_month<=Number(url.searchParams.get('priceLimit'))).map(t=>personalize(t,auth)));
    if(req.method==='GET' && url.pathname==='/api/tariffs/feed') {
      let t=items[0]; const id=Number(url.searchParams.get('id'));
      if(id)t=url.searchParams.get('next')==='true' ? items.find(t=>t.tariff_id>id)||items[0] : items.find(t=>t.tariff_id===id);
      return t?reply(personalize(t,auth)):reply('Запись не найдена',404);
    }
    if(!auth)return reply('Необходима авторизация',401);
    if(url.pathname==='/api/users/logout'){tokenValid=false;return reply({logged_out:true});}
    if(url.pathname==='/api/tariffs/draft')return reply(draft);
    if(req.method==='POST' && url.pathname==='/api/tariffs') {
      assert.match(req.headers['content-type'],/^multipart\/form-data; boundary=/);
      assert.match(body,/name="image"; filename="photo.jpg"/);
      assert.match(body,/name="video"; filename="video.mp4"/);
      assert(!body.includes('name="creator_id"'));
      if (draft) return reply('Черновик уже существует',409);
      const name=body.match(/name="tariff_name"\r\n\r\n([^\r]+)/)[1];
      draft={...tariff(nextId++,name,1,0),tariff_status:'черновик',ram_gb:0};return reply(draft,201);
    }
    const id=Number(url.pathname.split('/')[3]);
    if(req.method==='PUT') {
      assert(draft && draft.tariff_id === id, 'Publication must update the existing draft ID');
      assert.match(req.headers['content-type'],/^multipart\/form-data; boundary=/);
      const data = {};
      for (const field of ['tariff_name','short_description','price_per_month','ram_gb']) {
        const value = body.match(new RegExp('name="'+field+'"\\r\\n\\r\\n([^\\r]+)'))[1];
        data[field] = ['price_per_month','ram_gb'].includes(field) ? Number(value) : value;
      }
      if (body.includes('filename="new-photo.jpg"')) data.image_url='http://localhost:9000/cloud-tariffs/replaced.jpg?X-Amz-Signature=test';
      if (body.includes('filename="new-video.mp4"')) data.video_url='http://localhost:9000/cloud-tariffs/replaced.mp4?X-Amz-Signature=test';
      const t={...draft,...data,tariff_status:'опубликован'};items.push(t);draft=null;return reply(personalize(t,auth));
    }
    if(req.method==='DELETE') {items=items.filter(t=>t.tariff_id!==id);if(draft?.tariff_id===id)draft=null;return reply({deleted:true});}
    if(url.pathname.endsWith('/likes')) {const t=items.find(t=>t.tariff_id===id);const value=JSON.parse(body).value;t.like_count+=value-t.is_liked;t.is_liked=value;return reply({tariff_id:id,like_count:t.like_count,is_liked:value});}
    reply('Unknown route',404);
  });
  const s3 = http.createServer((req,res)=>{
    s3Calls.push({url:req.url,host:req.headers.host});
    res.writeHead(req.headers.host==='localhost:9000'?200:403,{'Content-Type':'image/jpeg'});
    res.end(fs.readFileSync(path.resolve('public/media/example.jpg')));
  });
  await new Promise(r=>backend.listen(8080,r));await new Promise(r=>s3.listen(9000,r));
  const vite=await createServer({server:{host:'127.0.0.1',port:3000,strictPort:true}});await vite.listen();
  let browser;
  try {
    browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
    const page=await browser.newPage({viewport:{width:440,height:920}});
    page.on('pageerror',e=>errors.push(e.message));
    const ready=async()=>{await page.waitForTimeout(100);await page.waitForFunction(()=>document.querySelector('.phone')?.getAttribute('aria-busy')==='false');};
    const chooseFile = async (index, file) => {
      const chooserPromise = page.waitForEvent('filechooser', {timeout: 5000});
      await page.locator('.media-field__preview').nth(index).click();
      const chooser = await chooserPromise;
      assert.equal(await chooser.element().getAttribute('id'), index === 0 ? 'image-file' : 'video-file');
      await chooser.setFiles(file);
    };
    const nav=(label)=>page.getByRole('navigation').getByText(label,{exact:true});
    const login=async()=>{await nav('Вход').click();await page.getByLabel('Логин',{exact:true}).fill('student');await page.getByLabel('Пароль',{exact:true}).fill('student123');await page.getByRole('button',{name:'Войти',exact:true}).click();await ready();};
    await page.goto('http://127.0.0.1:3000');await page.locator('.tile').first().waitFor().catch(async e=>{console.log('BODY',await page.locator('body').innerText(),'CALLS',calls,'ERRORS',errors);throw e});await ready();
    assert.equal(await page.locator('.tile').count(),2);
    assert.equal(await page.getByRole('button',{name:'Добавление',exact:true}).isDisabled(),true);
    assert(s3Calls.length && s3Calls.every(c=>c.host==='localhost:9000'&&c.url.includes('X-Amz-Signature=test')));
    await page.locator('#priceStep').fill('1');await page.getByRole('button',{name:'Применить фильтр по цене'}).click();await ready();
    assert.equal(await page.locator('.tile').count(),1);assert(calls.some(c=>c.query==='?priceLimit=1000'));
    await page.locator('.tile__link').first().click();await ready();await nav('Плитка').click();await ready();assert.equal(await page.locator('#priceStep').inputValue(),'1');
    await login();assert.equal(await nav('Выход').count(),1);assert.equal(await page.locator('.tile__delete').count(),1);
    await page.locator('.tile__link').first().click();await ready();
    await page.getByRole('button',{name:'Поставить лайк'}).click();await ready();assert.equal(await page.getByRole('button',{name:'Отменить лайк'}).getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:'Отменить лайк'}).click();await ready();
    await page.getByRole('button',{name:'Следующий тариф'}).click();await ready();assert(calls.some(c=>c.path==='/api/tariffs/feed'&&c.query.includes('next=true')));
    await nav('Добавление').click();await ready();
    await chooseFile(0, {name:'photo.jpg',mimeType:'image/jpeg',buffer:fs.readFileSync('public/media/example.jpg')});
    assert.equal(await page.getByLabel('Выбрать видео',{exact:true}).evaluate(el=>el.files.length),0);
    await chooseFile(1, {name:'video.mp4',mimeType:'video/mp4',buffer:fs.readFileSync('public/media/example.mp4')});
    await page.getByLabel('Название',{exact:true}).fill('Created Tariff');await page.getByRole('button',{name:'Далее',exact:true}).click();await ready();
    assert.equal(await page.locator('input[type="file"]').count(),2);
    const createdId = draft.tariff_id, createCount = calls.filter(c=>c.method==='POST'&&c.path==='/api/tariffs').length;
    assert.equal(await page.locator('.draft__file:visible').count(),0);
    assert.equal(await page.getByText('Изменить фото',{exact:true}).count(),0);
    assert.equal(await page.getByText('Изменить видео',{exact:true}).count(),0);
    await chooseFile(0, {name:'interim.jpg',mimeType:'image/jpeg',buffer:fs.readFileSync('public/media/example.jpg')});
    assert(await page.locator('.media-field img').getAttribute('src').then(s=>s.startsWith('blob:')));
    assert.equal(await page.locator('.media-field video').getAttribute('src').then(s=>s.startsWith('blob:')),false);
    await chooseFile(1, {name:'interim.mp4',mimeType:'video/mp4',buffer:fs.readFileSync('public/media/example.mp4')});
    assert(await page.locator('.media-field video').getAttribute('src').then(s=>s.startsWith('blob:')));

    await nav('Плитка').click();await ready();await nav('Добавление').click();await ready();assert.equal(await page.getByLabel('Название',{exact:true}).inputValue(),'Created Tariff');
    await page.getByLabel('Краткое описание',{exact:true}).fill('Новый тариф с настоящей отправкой файлов');await page.getByLabel('Цена, ₽ / месяц',{exact:true}).fill('800');await page.getByLabel('RAM, ГБ',{exact:true}).fill('8');
    await chooseFile(0, {name:'new-photo.jpg',mimeType:'image/jpeg',buffer:fs.readFileSync('public/media/example.jpg')});
    assert.equal(await page.getByLabel('Выбрать видео',{exact:true}).evaluate(el=>el.files.length),0);
    await chooseFile(1, {name:'new-video.mp4',mimeType:'video/mp4',buffer:fs.readFileSync('public/media/example.mp4')});
    assert(await page.locator('.media-field img').getAttribute('src').then(s=>s.startsWith('blob:')));
    assert(await page.locator('.media-field video').getAttribute('src').then(s=>s.startsWith('blob:')));
    await page.screenshot({path:'test-results/draft-replacement.png',fullPage:true});
    await page.getByRole('button',{name:'Опубликовать',exact:true}).click();await ready();assert.equal(await page.locator('h1').innerText(),'Created Tariff');
    assert.equal(calls.filter(c=>c.method==='POST'&&c.path==='/api/tariffs').length,createCount);
    assert.equal(items.find(t=>t.tariff_name==='Created Tariff').tariff_id,createdId);
    assert(items.find(t=>t.tariff_id===createdId).image_url.includes('replaced.jpg'));
    assert(items.find(t=>t.tariff_id===createdId).video_url.includes('replaced.mp4'));
    await nav('Плитка').click();await ready();await page.getByRole('button',{name:'Удалить тариф Created Tariff',exact:true}).click();await ready();assert(!items.some(t=>t.tariff_name==='Created Tariff'));
    delay=600;await page.getByRole('button',{name:'Применить фильтр по цене'}).click();assert.equal(await page.locator('#priceStep').isDisabled(),true);assert.equal(await page.locator('[inert]').count(),1);await ready();delay=0;
    await page.reload();await ready();assert.equal(await nav('Вход').count(),1);assert.equal(await page.evaluate(()=>localStorage.getItem('cloud_tariffs_jwt')),'contract-token');assert.equal(calls.at(-1).auth,false);
    await login();await page.locator('#priceStep').fill('1');await page.getByRole('button',{name:'Применить фильтр по цене'}).click();await ready();await nav('Выход').click();await ready();assert.equal(await page.locator('#priceStep').inputValue(),'0');assert.equal(await page.evaluate(()=>localStorage.getItem('cloud_tariffs_jwt')),null);
    await login();failStatus=503;await page.getByRole('button',{name:'Применить фильтр по цене'}).click();await ready();assert.equal(await page.locator('.tile').count(),0);assert.equal(await page.locator('.tariff-offline').count(),0);assert.equal(await page.getByRole('alert').count(),1);
    failStatus=0;await page.getByRole('button',{name:'Close alert'}).click();await nav('Выход').click();await ready();
    failStatus=503;await page.getByRole('button',{name:'Применить фильтр по цене'}).click();await ready();assert.equal(await page.locator('.tile').count(),4);assert.equal(await page.locator('.tariff-offline').count(),1);
    await nav('Лента').click();await ready();assert.equal(await page.locator('.feed__title').innerText(),'AWS EC2 Medium');assert.equal(await page.getByRole('button',{name:'Поставить лайк'}).isDisabled(),true);
    await nav('Плитка').click();await ready();await page.screenshot({path:process.env.QA_SCREENSHOT||'test-results/contract-guest.png',fullPage:true});
    failStatus=400;await page.getByRole('button',{name:'Применить фильтр по цене'}).click();await ready();assert.equal(await page.locator('.tile').count(),0);
    failStatus=0;await page.getByRole('button',{name:'Close alert'}).click();await nav('Вход').click();await page.getByLabel('Логин',{exact:true}).fill('student');await page.getByLabel('Пароль',{exact:true}).fill('wrong');await page.getByRole('button',{name:'Войти',exact:true}).click();await ready();assert.equal(await page.locator('h1').innerText(),'Вход');assert.equal(await nav('Выход').count(),0);
    await new Promise(r=>backend.close(r));await page.goto('http://127.0.0.1:3000/tariffs');await ready();assert.equal(await page.locator('.tile').count(),4);assert.equal(await page.locator('.tariff-offline').count(),1);
    assert.deepEqual(errors,[]);console.log('PASS: guest, API filter, Redux navigation, login, owner controls, like/unlike, next, independent files, multipart create, photo/video click opens file chooser on existing draft immediately and after reopening, draft restore, publish, delete, blocking loader, F5 token, logout reset, no authenticated mocks, guest fallback, HTTP400/401 errors, S3 Host/query, backend fully stopped; '+calls.length+' API calls.');
  } finally {if(browser)await browser.close();await vite.close();if(backend.listening)backend.close();s3.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
