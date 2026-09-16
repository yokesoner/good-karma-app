# Разворачивание в проде (reg.ru)

Пошаговая инструкция для переезда с текущего dev-окружения (Supabase в
Ирландии, локальный `npm run dev`) на боевой хостинг. Целевой провайдер —
reg.ru (см. «Юридическое» в AGENTS.md/CLAUDE.md): нужен именно VPS/облачный
сервер с Node.js, а не «сайт-визитка» тариф — Next.js работает как сервер,
а не набор статических файлов.

Оплата (ЮKassa) сознательно не входит в этот документ — по решению от
2026-09-16 сайт сначала выходит в прод с оплатой на месте/переводом, приём
онлайн-платежей делаем отдельным этапом позже.

## 0. Что уже готово в коде

- `next.config.mjs`: `output: "standalone"` (минимальная самодостаточная
  сборка для VPS) и базовые security-заголовки (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).
- `DATABASE_URL`/`DIRECT_URL` с `?connection_limit=2` — без этого `next
  build` падает с `EMAXCONNSESSION` на маленьких пулах (см. AGENTS.md).
- Presigned-загрузка картинок в S3 (товары/акции/категории/вок) уже готова
  к любому S3-совместимому хранилищу — нужны только реальные `S3_*` ключи.
- Вход в профиль через Telegram-бота уже работает на реальном токене.

## 1. Что купить/завести на reg.ru

1. **VPS или Рег.облако сервер**, Ubuntu 22.04/24.04 LTS, публичный IPv4.
   Для этого масштаба (один сайт + Postgres на той же машине) достаточно
   2 vCPU / 4 GB RAM / от 40 GB NVMe — берите ближайший тариф сверху этого.
2. **Домен** — либо уже есть, либо регистрируется там же.
3. Опционально, но правильно по 152-ФЗ (см. раздел 6): всё должно физически
   находиться в РФ — сам VPS на reg.ru это уже удовлетворяет.

Самостоятельно решите на месте: self-hosted Postgres на этом же VPS
(проще, дешевле, ниже в этом документе) или отдельная managed-база в
Рег.облаке (меньше забот с бэкапами, но отдельная стоимость). Для одного
кафе-сайта самостоятельный Postgres на той же машине — разумный дефолт.

## 2. Переменные окружения — что понадобится

| Переменная | Откуда взять | Обязательна |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | новая база (см. раздел 4); одинаковые, если Postgres self-hosted без пулера | да |
| `ADMIN_SESSION_SECRET` | `openssl rand -base64 32` — **новое значение**, не то, что в dev `.env` | да |
| `CUSTOMER_SESSION_SECRET` | `openssl rand -base64 32` — тоже новое | да |
| `TELEGRAM_BOT_TOKEN` | тот же боевой токен от @BotFather, что уже используется | да (иначе вход в профиль отключён) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL_BASE` | Рег.облако S3, Yandex Object Storage, Selectel или VK Cloud — любой S3-совместимый | да, иначе загрузка картинок из админки не работает |
| `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` | не нужны сейчас — оплата отложена | нет |
| `YANDEX_MAPS_API_KEY`, `YANDEX_GEOCODER_API_KEY` | если геолокация на чекауте использует их — проверить перед запуском | уточнить |

Секреты `ADMIN_SESSION_SECRET`/`CUSTOMER_SESSION_SECRET` в текущем `.env`
помечены комментарием «не для продакшена» — это буквально так, сгенерируйте
новые прямо на сервере, не копируйте dev-значения.

## 3. Подготовка сервера

```bash
apt update && apt upgrade -y
apt install -y curl git nginx ufw

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PM2 — держит процесс живым и поднимает после reboot
npm install -g pm2

# Postgres 16, если self-hosted на этой же машине
apt install -y postgresql postgresql-contrib
```

## 4. База данных

### 4.1 Self-hosted Postgres на VPS

```bash
sudo -u postgres psql -c "CREATE USER goodkarma WITH PASSWORD 'СЛОЖНЫЙ_ПАРОЛЬ_БЕЗ_?/@#';"
sudo -u postgres psql -c "CREATE DATABASE goodkarma OWNER goodkarma;"
```

Пароль — без `?`, `/`, `@`, `#` (см. известную особенность окружения в
AGENTS.md, ломает парсинг URL подключения). Тогда:

```
DATABASE_URL="postgresql://goodkarma:ПАРОЛЬ@localhost:5432/goodkarma"
DIRECT_URL="postgresql://goodkarma:ПАРОЛЬ@localhost:5432/goodkarma"
```

Локальный self-hosted Postgres без пулера — `connection_limit` можно не
добавлять, но не мешает оставить `?connection_limit=5`.

### 4.2 Перенос текущих данных из Supabase (если нужно сохранить каталог/заказы)

```bash
# На машине с доступом к текущей Supabase-базе (DIRECT_URL из dev .env):
pg_dump --no-owner --no-privileges "$OLD_DIRECT_URL" > goodkarma_dump.sql

# На новом сервере:
psql "$DATABASE_URL" < goodkarma_dump.sql
```

Если это по сути новый старт (не жалко текущих тестовых заказов/данных) —
проще не переносить дамп, а просто накатить схему и сид с нуля (шаг 5).

## 5. Деплой приложения

```bash
git clone <ваш-репозиторий> /var/www/good-karma
cd /var/www/good-karma
cp .env.example .env   # затем заполнить реальными значениями из раздела 2

npm ci
npx prisma generate
npx prisma db push        # применить схему к новой базе
npm run db:seed           # только если не переносили дамп — наполняет каталог/уровни
npm run build

# первый администратор
npm run create-admin -- admin@ваш-домен.ru 'НАДЁЖНЫЙ-ПАРОЛЬ' 'Имя' owner
```

Пароль администратора — не `qwerty1234` из тестового аккаунта, который
сейчас используется для разработки.

## 6. Запуск через PM2

`output: "standalone"` уже собрал самодостаточный сервер — процесс
запускается напрямую через Node, не через `next start`:

```bash
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp .env .next/standalone/.env

pm2 start .next/standalone/server.js --name good-karma
pm2 save
pm2 startup   # выведет команду для автозапуска после перезагрузки — выполнить её
```

После правки кода на сервере: `npm run build`, затем повторить два `cp` из
блока выше и `pm2 restart good-karma`.

## 7. Nginx как reverse proxy + HTTPS

```nginx
# /etc/nginx/sites-available/good-karma
server {
    listen 80;
    server_name ваш-домен.ru www.ваш-домен.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/good-karma /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

apt install -y certbot python3-certbot-nginx
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru
```

Certbot сам допишет в конфиг `listen 443 ssl` и настроит автопродление
(проверить: `certbot renew --dry-run`).

## 8. DNS

В панели reg.ru у домена — A-запись на публичный IP VPS (и отдельная A-
запись для `www`, либо CNAME на корень).

## 9. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

## 10. Чек-лист перед реальным запуском

- [ ] `ADMIN_SESSION_SECRET` и `CUSTOMER_SESSION_SECRET` — новые значения,
      не скопированные из dev `.env`
- [ ] Пароль первого администратора — не `qwerty1234`
- [ ] База физически в РФ (152-ФЗ) — self-hosted на VPS или managed в
      российском облаке, не Supabase/Ирландия
- [ ] Реальные `S3_*` ключи — иначе загрузка картинок из админки не работает
      (сам код уже готов, см. `src/server/adminUploads.ts`)
- [ ] `NODE_ENV=production` (PM2/`next build` выставляют это сами, но не
      лишнее сверить в `pm2 env <id>`)
- [ ] Регулярный бэкап базы — как минимум `pg_dump` по cron в отдельное
      хранилище, не только на том же VPS
- [ ] SSH только по ключу, парольный вход отключён
      (`PasswordAuthentication no` в `/etc/ssh/sshd_config`)
- [ ] Решить судьбу тестовых данных в базе — промокод `SEP` и тестовый
      уровень Karma Club «Premium от 100 000 баллов», созданные при
      исследовании админки, — удалить или оставить осознанно
- [ ] `certbot renew --dry-run` проходит без ошибок

## 11. Дымовой тест после деплоя

- Открыть сайт по домену (не по IP) — HTTPS, без предупреждений браузера
- Оформить тестовый заказ до конца (корзина → чекаут → страница заказа)
- Войти в `/profile` по реальному Telegram-боту
- Зайти в `/admin`, отредактировать любую акцию, загрузить картинку через
  файловый загрузчик — единственное, что не проверялось до реальных S3-
  ключей
- `npm run check:delivery` — границы зон доставки не потерялись при переносе

## Чего в проекте всё ещё нет к моменту запуска

Реальная онлайн-оплата (ЮKassa + чек по 54-ФЗ, сознательно отложено),
выход со всех устройств разом (сессия покупателя — одна долгоживущая
cookie на устройство), конструктор пиццы, «миры» категорий — см. AGENTS.md
/ CLAUDE.md, «Чего ещё нет».
