#!/usr/bin/env node
// Задати пароль бети:  npm run beta:pass -- "новий пароль"
// Записує тільки хеш у src/betaPassword.js. Після цього - коміт і деплой.

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const password = process.argv.slice(2).join(" ");
if (!password) {
  console.error('Використання: npm run beta:pass -- "пароль"');
  process.exit(1);
}

const hash = createHash("sha256")
  .update("unmatched-draft-beta:" + password)
  .digest("hex");

const file = fileURLToPath(new URL("../src/betaPassword.js", import.meta.url));
writeFileSync(
  file,
  `// Хеш пароля бета-доступу. Змінити: npm run beta:pass -- "пароль"\n` +
    `export const BETA_PASSWORD_HASH =\n  "${hash}";\n`,
);
console.log("Пароль оновлено. Закомітьте src/betaPassword.js і задеплойте.");
console.log("Усі, хто входив зі старим паролем, відвалляться і мають ввести новий.");
