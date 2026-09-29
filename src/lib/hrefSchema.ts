import { z } from "zod";

// Ссылка из админки — либо путь внутри сайта, либо https. Голое
// "javascript:" и прочее отсекаются здесь, а не полагаются на то, что
// админ не ошибётся. Общая для баннеров и слайдов главного экрана.
export const SITE_HREF_MESSAGE = "Ссылка: путь на сайте (/menu) или адрес https://…";

export function isAllowedSiteHref(value: string) {
  return /^\/(?!\/)[^\s]*$/.test(value) || /^https:\/\/[^\s]+$/i.test(value);
}

/** Пустая строка допустима — «ссылки нет». */
export const optionalSiteHrefSchema = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === "" || isAllowedSiteHref(value), { message: SITE_HREF_MESSAGE });

export const siteHrefSchema = z
  .string()
  .trim()
  .min(1, "Укажите ссылку")
  .max(300)
  .refine(isAllowedSiteHref, { message: SITE_HREF_MESSAGE });
