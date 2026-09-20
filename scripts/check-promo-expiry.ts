// Для реального cron на VPS (см. DEPLOYMENT.md) — та же проверка, что
// незаметно происходит при каждом заходе в /admin (src/app/admin/(protected)/layout.tsx),
// но с гарантией сработать даже в день, когда никто не открывал админку.
import { db } from "../src/lib/db";
import { checkAndNotifyExpiringPromotions } from "../src/server/promoMaintenance";

checkAndNotifyExpiringPromotions()
  .then(() => console.log("Проверка истекающих акций выполнена."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
