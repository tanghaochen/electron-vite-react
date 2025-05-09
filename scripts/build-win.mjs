import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义命令
const commands = [
  // 设置环境变量以禁用类型检查
  "set TS_NODE_TRANSPILE_ONLY=true",
  // 使用tsconfig.build.json构建项目
  "vite build",
  // 使用electron-builder打包应用
  "electron-builder --win --x64",
];

// 执行命令
try {
  for (const command of commands) {
    console.log(`执行命令: ${command}`);
    execSync(command, {
      stdio: "inherit",
      env: {
        ...process.env,
        TS_NODE_TRANSPILE_ONLY: "true",
        SKIP_TYPESCRIPT_CHECK: "true",
      },
    });
  }

  console.log("✅ 构建成功!");
} catch (error) {
  console.error("❌ 构建失败:", error);
  process.exit(1);
}
