import { getDeliveryZone, deliveryCostCents, distanceKm, CAFE, type DeliveryZone } from "../src/lib/delivery";

const ZONES: DeliveryZone[] = [
  { zone: 1, maxDistanceKm: 4,  priceCents: 25000, freeFromCents: 150000 },
  { zone: 2, maxDistanceKm: 8,  priceCents: 35000, freeFromCents: 250000 },
  { zone: 3, maxDistanceKm: 12, priceCents: 45000, freeFromCents: 350000 },
  { zone: 4, maxDistanceKm: 16, priceCents: 55000, freeFromCents: 450000 },
  { zone: 5, maxDistanceKm: 20, priceCents: 65000, freeFromCents: 550000 },
];

let failed = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "ФЕЙЛ"} ${label}: ${JSON.stringify(actual)}${ok ? "" : ` (ждали ${JSON.stringify(expected)})`}`);
};

console.log("--- границы зон ---");
for (const [km, expectedZone] of [[0,1],[3.9,1],[4,1],[4.1,2],[8,2],[8.1,3],[12,3],[12.1,4],[16,4],[16.1,5],[20,5]] as [number,number][]) {
  check(`${km} км`, getDeliveryZone(ZONES, km)?.zone, expectedZone);
}
console.log("--- вне зоны ---");
check("20.1 км", getDeliveryZone(ZONES, 20.1), null);
check("35 км", getDeliveryZone(ZONES, 35), null);
check("адрес не указан", getDeliveryZone(ZONES, null), null);

console.log("--- стоимость и бесплатный порог ---");
const z1 = getDeliveryZone(ZONES, 3.2)!;
check("зона 1, заказ 1200 ₽ -> платно 250", deliveryCostCents(z1, 120000), 25000);
check("зона 1, заказ 1500 ₽ -> бесплатно", deliveryCostCents(z1, 150000), 0);
check("зона 1, заказ 1600 ₽ -> бесплатно", deliveryCostCents(z1, 160000), 0);
const z2 = getDeliveryZone(ZONES, 6.4)!;
check("зона 2, заказ 1600 ₽ -> платно 350", deliveryCostCents(z2, 160000), 35000);
check("зона 2, заказ 2500 ₽ -> бесплатно", deliveryCostCents(z2, 250000), 0);
check("вне зоны -> 0", deliveryCostCents(null, 500000), 0);

console.log("--- гаверсинус ---");
check("расстояние до самого кафе", distanceKm(CAFE.lat, CAFE.lng, CAFE.lat, CAFE.lng), 0);
const d = distanceKm(CAFE.lat, CAFE.lng, 45.07, 42.02);
console.log(`     точка в 4-5 км: ${d} км ${d > 3 && d < 6 ? "OK" : "ПОДОЗРИТЕЛЬНО"}`);
if (!(d > 3 && d < 6)) failed++;

console.log(failed === 0 ? "\nВсе проверки прошли." : `\nПРОВАЛЕНО: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
