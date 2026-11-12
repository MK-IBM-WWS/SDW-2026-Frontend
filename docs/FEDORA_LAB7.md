# Запуск лабораторной работы 7 на Fedora Linux

## 1. Как расположить папки

Распакуйте новый архив фронтенда и ваш исходный архив `SDW-2026-Backend(4).zip` рядом:

```text
RIP-Lab7/
  frontend/
  SDW-2026-Backend/
```

Все команды ниже с `cd frontend` или `cd SDW-2026-Backend` выполняются относительно `RIP-Lab7`. Бэкенд не изменён. Его исходную папку, `.env`, БД и MinIO не заменяйте файлами фронтенда.

В показе используются два независимых адреса:

| Часть показа | Адрес | Источник данных |
|---|---|---|
| Скриншоты 1–7 | `https://ВАШ_ЛОГИН.github.io/ВАШ_РЕПОЗИТОРИЙ/` | Только mock из сборки |
| Скриншоты 8–14 | `https://IP_НОУТБУКА:3000` | Go + PostgreSQL + Redis + MinIO ноутбука через Node.js |
| Скриншоты 15–17 | Редактор кода на ноутбуке | CSS, Redux, manifest, прокси |

GitHub Pages не обращается ни к localhost, ни к IP ноутбука. Локальная сборка работает с API через относительный путь `/api`.

## 2. Пакеты Fedora

Если Go, Docker и Node уже установлены и подходят по версии, повторная установка не нужна.

```bash
sudo dnf install -y nodejs24 nodejs24-npm nodejs24-bin nodejs24-npm-bin golang git gh mkcert nss-tools openssl unzip
node --version
npm --version
go version
```

Нужны Node.js 22.12+ из ветки 22 или 24+, Go 1.25+, Docker Engine и Compose v2. Для этой инструкции используйте Node.js 24. Если установленная ранее Node имеет приоритет, проверьте `command -v node` и исправьте выбранную версию в своём менеджере Node.

Docker Engine из официального репозитория, если ещё не установлен:

```bash
sudo dnf config-manager addrepo --from-repofile https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker compose version
```

Если у вас уже работает Docker, этот блок пропустите. Docker Desktop/Podman для показанного сценария дополнительно не нужны.

Один раз установите зависимости фронтенда:

```bash
cd frontend
npm ci
```

В архиве нет `node_modules`: зависимости устанавливаются на вашей машине по `package-lock.json`.

## 3. Публикация mock-фронтенда на GitHub Pages — скриншоты 1–7

### 3.1. Создать репозиторий

В своём GitHub откройте New repository. Например, имя `cloud-tariffs-lab7`, видимость Public. Создайте **пустой** репозиторий без README, `.gitignore` и License, чтобы первый push не конфликтовал.

Используйте отдельный репозиторий с содержимым папки `frontend` в корне. Бэкенд и его `.env` туда не копируются. Для Pages публикуются только файлы `dist-pages`.

### 3.2. Настроить доступ Git к GitHub

На своём ноутбуке:

```bash
gh auth login
```

Выберите GitHub.com → HTTPS → вход через браузер; завершите вход в своём аккаунте.

```bash
gh auth setup-git
```

Если Git просит имя и email при первом commit, задайте их в репозитории командами `git config user.name "Борис Иванов"` и `git config user.email "ВАШ_EMAIL_ИЗ_GITHUB"`. Вместо email можно взять свой адрес `noreply` из GitHub → Settings → Emails.

### 3.3. Отправить исходники и опубликовать сборку

В терминале **внутри папки frontend**:

```bash
GITHUB_USER=ВАШ_ЛОГИН_GITHUB
REPO=cloud-tariffs-lab7
git init -b main
git add .
git commit -m "Lab 7: responsive UI, PWA and HTTPS"
git remote add origin "https://github.com/$GITHUB_USER/$REPO.git"
git push -u origin main
npm run deploy -- "$REPO"
```

Подставьте свой логин и настоящее имя репозитория. Если фронтенд уже находится в вашем Git-репозитории с `origin`, не выполняйте `git init` и `git remote add` повторно: используйте существующий репозиторий и правильное имя в `npm run deploy -- ИМЯ`.

`deploy` выполняет TypeScript-проверку, создаёт `dist-pages` в режиме `pages` и с помощью `gh-pages` отправляет его в ветку `gh-pages`. `base` задаётся автоматически как `/REPO/`; для репозитория вида `LOGIN.github.io` используется `/`. Не требуется вручную менять пути в коде. Это реализация варианта с `gh-pages` из методички.

### 3.4. Включить GitHub Pages

В репозитории GitHub:

1. Settings → Pages.
2. Build and deployment → Source → **Deploy from a branch**.
3. Branch → **gh-pages**, папка **/(root)**.
4. Save. Дождитесь успешного развёртывания; статус виден в Actions / Deployments.
5. Откройте адрес, показанный GitHub во вкладке Pages. Для выбранного примера он имеет вид `https://ЛОГИН.github.io/cloud-tariffs-lab7/`.

На GitHub не надо запускать Node.js или Go: это статическая mock-сборка. Сборка для ноутбука находится в другом каталоге `dist`, поэтому она случайно не отправится в Pages.

При обновлении:

```bash
git add .
git commit -m "Update Lab 7"
git push
npm run deploy -- cloud-tariffs-lab7
```

Если нужно только собрать без публикации:

```bash
npm run build:pages -- cloud-tariffs-lab7
```

### 3.5. Установить PWA на Android

1. В обычном Chrome на телефоне откройте **HTTPS-ссылку Pages**, не исходники репозитория.
2. Дождитесь появления тарифов и загрузки кеша. При первом открытии оставьте страницу открытой несколько секунд с интернетом.
3. Сделайте скриншот 1. В меню Chrome `⋮` выберите «Установить приложение» / «Добавить на главный экран». Сначала зафиксируйте диалог или меню — скриншот 2; затем подтвердите установку.
4. Запускайте приложение с появившейся иконки «Тарифы». В установленной PWA нет обычной адресной строки браузера.
5. Выполните шаги 3–6 из отдельного файла со скриншотами.
6. Для проверки офлайна после первой успешной загрузки включите авиарежим, закройте PWA и откройте её снова. Mock-карточки, переходы, изображения и локальные видео должны оставаться доступны. После проверки выключите авиарежим.

Кеш создаётся после `build`; `npm run dev` не регистрирует Service Worker. API, вход, публикация и лайки в Pages не работают: они требуют локального адреса ноутбука. Кнопка входа в форме Pages отключена и выводится пояснение.

Для проверки на ноутбуке: DevTools → Application → Manifest и Service Workers. Должны быть manifest с PNG-иконками и активный Service Worker. Network не должен содержать запросов `/api` или `/s3` при просмотре mock.

## 4. Запустить бэкенд ноутбука — до скриншота 8

Терминал №1, папка исходного бэкенда:

```bash
cd SDW-2026-Backend
sudo docker compose up -d postgres redis minio adminer
sudo docker compose ps
go mod download
go run ./cmd/migrate
```

Подождите, пока PostgreSQL станет healthy, Redis — healthy, MinIO — running. Если миграция выполнена до готовности контейнеров, повторите её после готовности.

Если учебные 120000 тарифов уже созданы в прошлой лабораторной, заново создавать их не требуется. Для новой БД:

```bash
go run ./cmd/seed
```

Затем:

```bash
go run ./cmd/tariffs
```

Этот терминал оставьте работающим. Используются прежние параметры `.env`: PostgreSQL `localhost:666`, Redis `localhost:6379`, MinIO `localhost:9000`, Go `:8080`. Миграция создаёт учебный аккаунт `student` / `student123` для новой БД; пароль уже существующей учётной записи не меняется.

Минимально нужны `postgres redis minio`. Adminer нужен только для просмотра БД. Portainer в показе ЛР7 не используется.

Проверить на ноутбуке:

```bash
curl -i 'http://127.0.0.1:8080/api/tariffs?page=1&limit=10'
```

Ожидается HTTP 200 и JSON с `data`, `total`, `page`, `limit`. Если Redis недоступен, лента не загрузится: запустите Redis и проверьте пароль в исходном `.env`.

Дополнительные адреса ноутбука: Swagger `http://localhost:8080/swagger/index.html`, Adminer `http://localhost:8081`, MinIO Console `http://localhost:9001`. Вход в MinIO — `root` / `rootpassword`; Adminer: сервер `postgres`, пользователь `cloud_user`, пароль `cloud_password`, БД `cloud_tariffs`. Эти адреса не нужны телефону.

## 5. Общая локальная сеть и сертификат

### 5.1. Найти LAN IP

Телефон и ноутбук подключите к одной домашней Wi-Fi-сети. Ноутбук также может быть подключён проводом к тому же роутеру. Гостевая сеть с изоляцией клиентов не подходит.

```bash
ip -4 -brief addr
```

Выберите адрес Wi-Fi/Ethernet, например `192.168.1.10`. Не используйте `127.0.0.1`, `docker0`, VPN/Tailscale. `localhost` на телефоне — это сам телефон.

Ниже замените `192.168.1.10` своим IP. Желательно закрепить адрес ноутбука в DHCP роутера на время защиты.

### 5.2. Создать сертификат для этого IP

Терминал №2, папка frontend:

```bash
cd frontend
npm run certs -- 192.168.1.10
```

Скрипт вызывает системный `mkcert` из Fedora: устанавливает локальный корневой CA на ноутбуке, выпускает сертификат с SAN для `localhost`, `127.0.0.1`, `::1` и указанного LAN IP. Подтвердите запрос системного пароля, если его выдаст `mkcert`.

Появятся:

| Файл | Назначение |
|---|---|
| `certs/localhost.pem` | Сертификат HTTPS-сервера |
| `certs/localhost-key.pem` | Приватный ключ сервера |
| `certs/local-ca.crt` | Публичный сертификат ЦС для телефона |

В методичке приведён npm-пакет с названием `mkcert`. Здесь используется одноимённая системная утилита FiloSottile/mkcert: она позволяет явно включить LAN IP в SAN и установить доверие. Дополнительно устанавливать npm-пакет `mkcert` и `vite-plugin-mkcert` не нужно. HTTPS принимает отдельный сервер Node.js, а не dev-сервер Vite.

### 5.3. Доверие сертификату на Android

Передайте **только** `certs/local-ca.crt` на свой телефон, например USB-кабелем в папку Download.

В настройках Android найдите «Установка сертификата» или «Сертификат ЦС». Типичный путь: Настройки → Безопасность и конфиденциальность → Другие настройки безопасности → Шифрование и учётные данные → Установить сертификат → **Сертификат ЦС**. Названия отличаются у производителей. Подтвердите установку своего локального CA и выберите `local-ca.crt`. Может потребоваться PIN блокировки экрана.

Это должен быть именно корневой сертификат ЦС, а не VPN-сертификат и не `localhost.pem`. После установки полностью перезапустите Chrome. Откройте локальный HTTPS-адрес из следующего раздела и проверьте сведения о соединении: сертификат доверенный, без предупреждения.

Папка `certs` исключена из Git. Не передавайте `localhost-key.pem` и `rootCA-key.pem`, который хранится в каталоге `mkcert -CAROOT`. На GitHub они не нужны. Если IP ноутбука изменился, повторите `npm run certs -- НОВЫЙ_IP` и перезапустите HTTPS-сервер; уже установленный корневой CA обычно остаётся тем же.

### 5.4. Разрешить TCP 3000 в Fedora

Если firewalld активен:

```bash
sudo firewall-cmd --get-active-zones
```

Найдите зону, в которой указан ваш Wi-Fi/Ethernet-интерфейс. Для примера, если это `FedoraWorkstation`:

```bash
sudo firewall-cmd --zone=FedoraWorkstation --add-port=3000/tcp
```

Подставьте фактическое имя зоны. Правило временное до перезапуска firewalld/системы, для защиты этого достаточно. Если нужно постоянное:

```bash
sudo firewall-cmd --zone=FedoraWorkstation --add-port=3000/tcp --permanent
```

Открывать телефону порты 666, 6379, 8080 и 9000 для данного сценария не требуется: запросы браузера идут через TCP 3000.

## 6. Собрать и запустить локальный HTTPS-прокси

Терминал №2, frontend:

```bash
npm run build
npm run start:https
```

Сервер слушает `0.0.0.0:3000`. Оставьте его работающим.

На ноутбуке и затем в **обычном Chrome на телефоне** откройте:

```text
https://192.168.1.10:3000
```

Войдите `student` / `student123`, затем откройте плитку, ленту/Подробнее и добавление/черновик. Установленная с Pages PWA остаётся mock-приложением: для показа с бэкендом нужен новый локальный адрес. При желании можно отдельно установить локальную PWA после установки доверенного CA.

Как проходит запрос:

- Телефон → `https://IP:3000/api/...` → Node.js → `http://127.0.0.1:8080/api/...`.
- Телефон → `https://IP:3000/s3/...` → Node.js → `http://127.0.0.1:9000/...`.
- Node.js для MinIO сохраняет query-строку подписанного URL и выставляет `Host: localhost:9000` — тот адрес, с которым исходный бэкенд подписывает объекты.

Браузер видит один HTTPS-origin; запросы API и медиа не нарушают mixed content. HTTP между локальным Node.js и локальными сервисами остаётся внутри ноутбука. Настройка `CORS_ORIGINS` бэкенда не меняется, потому что запросы браузера идут на тот же origin через прокси.

Проверки в терминале frontend:

```bash
curl --cacert certs/local-ca.crt -I https://192.168.1.10:3000/
curl --cacert certs/local-ca.crt 'https://192.168.1.10:3000/api/tariffs?page=1&limit=10'
openssl x509 -in certs/localhost.pem -noout -issuer -subject -ext subjectAltName
```

Первая команда должна дать HTTP 200, вторая — JSON бэкенда, третья — issuer и SAN с IP ноутбука. Эти команды подходят для подготовки скриншота 13.

Для изменения адресов сервисов скопируйте `.env.proxy.example` в `.env.proxy`, измените нужные значения и перезапустите `npm run start:https`. Стандартный запуск не требует этого файла. `S3_SIGNED_HOST` должен совпадать с адресом `MINIO_ENDPOINT`, которым исходный Go-бэкенд подписывает ссылки.

Важно: после F5 авторизация в Redux сбрасывается по правилу прошлой ЛР6. Снова войдите перед показом добавления. Фильтр и номер страницы восстанавливаются из sessionStorage текущей вкладки; JWT из localStorage автоматически не используется для входа.

## 7. Дополнительный вариант: фронтенд в Docker

Основной вариант выше проще для защиты и показа кода. Если нужен контейнер фронтенда, сначала создайте сертификаты на хосте, запустите исходный Go-бэкенд и его сервисы, затем из frontend:

```bash
sudo docker compose -f docker-compose.https.yml up -d --build
```

Перед этим остановите локальный `npm run start:https`, чтобы освободить 3000. Go должен слушать `0.0.0.0:8080`, как в исходном `config/config.toml`. Контейнер фронтенда использует `host.docker.internal` и `host-gateway`; подпись MinIO сохраняется через отдельный `S3_SIGNED_HOST`.

Остановка:

```bash
sudo docker compose -f docker-compose.https.yml down
```

Старый `docker-compose.yml` оставлен для dev-сервера по HTTP; для показа HTTPS используйте именно `docker-compose.https.yml` либо основной запуск через npm.

## 8. Диагностика

| Симптом | Что проверить |
|---|---|
| Телефон не открывает локальный адрес | Оба устройства в одной сети; IP интерфейса ноутбука; Node слушает `0.0.0.0:3000`; firewalld; отсутствие AP/client isolation |
| `ERR_CERT_AUTHORITY_INVALID` | Установлен ли `local-ca.crt` именно как сертификат ЦС на Android; полностью перезапущен ли Chrome |
| `ERR_CERT_COMMON_NAME_INVALID` | IP в адресной строке должен присутствовать в SAN; пересоздайте сертификат для текущего IP |
| В Pages белая страница или 404 медиа | Настоящее имя репозитория передано в `npm run deploy -- ИМЯ`; выбраны gh-pages и /(root); открыта ссылка Pages |
| Не появляется установка PWA | Обычный Chrome, HTTPS и доверенный сертификат, сборка после build, manifest и активный SW; не incognito и не встроенный браузер мессенджера |
| Service Worker имеет MIME `text/html` | Нужна свежая полная сборка; путь SW должен содержать base Pages. В Node отсутствующий SW возвращает 404, а не HTML |
| После деплоя старая версия | Дождитесь завершения Pages; закройте старую PWA и откройте заново. Для сброса на ноутбуке Application → Service Workers → Unregister, затем Storage → Clear site data |
| Локально написано «Сервер недоступен» | Это гостевой fallback: Go не запущен или неверный API_TARGET. Для показа 8–12 нужен работающий API, а не mock |
| Ошибка ленты/Redis | `docker compose ps`, пароль Redis из исходного .env; проверьте API-терминал. Ошибка работающего API не подменяется mock |
| MinIO отвечает 403 SignatureDoesNotMatch | S3_SIGNED_HOST равен исходному MINIO_ENDPOINT (`localhost:9000`); не меняйте query-строку подписанного URL |
| После F5 исчез вход | Так сохранено требование ЛР6; повторно аутентифицируйтесь |
| Вход student не проходит | Аккаунт существует и миграция выполнена; существующий пароль миграция не перезаписывает |
| `npm ci` не находит подходящую Node | Проверьте `node --version`; используйте установленную Node.js 24 |

Остановка Node/Go — Ctrl+C в соответствующих терминалах. Контейнеры бэкенда: `sudo docker compose stop` из его папки. Не используйте `down -v`, если хотите сохранить БД и Redis.

## Источники

Основа — приложенная `PWA.md`; реализован её ручной вариант manifest + Service Worker, Grid/media queries и публикация `gh-pages`.

- [Vite: static deploy и base](https://vite.dev/guide/static-deploy)
- [GitHub Pages: выбор ветки публикации](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Node.js HTTPS](https://nodejs.org/api/https.html)
- [MDN: Service Worker и secure context](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [mkcert: доверенный локальный CA и сертификаты](https://github.com/FiloSottile/mkcert)
- [Docker Engine на Fedora](https://docs.docker.com/engine/install/fedora/)
- [Fedora: Node.js 24](https://packages.fedoraproject.org/pkgs/nodejs24/)
- [Fedora: mkcert](https://packages.fedoraproject.org/pkgs/mkcert/mkcert/)
