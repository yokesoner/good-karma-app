import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "../src/lib/db";

const InputSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(10, "Пароль должен содержать не менее 10 символов"),
  name: z.string().trim().min(1).max(80),
});

async function main() {
  const [email, password, suppliedName] = process.argv.slice(2);
  const parsed = InputSchema.safeParse({
    email,
    password,
    name: suppliedName || email?.split("@")[0] || "",
  });
  if (!parsed.success) {
    console.error("Использование: npm run create-admin -- email@example.com 'надёжный-пароль' ['Имя']");
    console.error(parsed.error.issues[0]?.message ?? "Проверьте аргументы");
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const admin = await db.adminUser.upsert({
    where: { email: parsed.data.email },
    update: { passwordHash, name: parsed.data.name },
    create: { email: parsed.data.email, passwordHash, name: parsed.data.name },
    select: { email: true, name: true },
  });
  console.log(`Администратор ${admin.name} <${admin.email}> создан или обновлён.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
