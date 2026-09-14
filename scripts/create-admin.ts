import { hash } from "bcryptjs";
import { AdminRole } from "@prisma/client";
import { z } from "zod";
import { db } from "../src/lib/db";

const InputSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(10, "Пароль должен содержать не менее 10 символов"),
  name: z.string().trim().min(1).max(80),
  role: z.nativeEnum(AdminRole),
});

async function main() {
  const [email, password, suppliedName, suppliedRole] = process.argv.slice(2);
  // По умолчанию OWNER — это скрипт бутстрапа первого администратора,
  // ограничивать через CLI некого: STAFF заводится позже через /admin/team.
  const role = suppliedRole?.toUpperCase() === "STAFF" ? "STAFF" : "OWNER";
  const parsed = InputSchema.safeParse({
    email,
    password,
    name: suppliedName || email?.split("@")[0] || "",
    role,
  });
  if (!parsed.success) {
    console.error("Использование: npm run create-admin -- email@example.com 'надёжный-пароль' ['Имя'] [owner|staff]");
    console.error(parsed.error.issues[0]?.message ?? "Проверьте аргументы");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const admin = await db.adminUser.upsert({
    where: { email: parsed.data.email },
    update: { passwordHash, name: parsed.data.name },
    create: { email: parsed.data.email, passwordHash, name: parsed.data.name, role: parsed.data.role },
    select: { email: true, name: true, role: true },
  });
  console.log(`Администратор ${admin.name} <${admin.email}> (${admin.role}) создан или обновлён.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
