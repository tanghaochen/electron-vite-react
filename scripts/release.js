#!/usr/bin/env node

/**
 * 此脚本用于自动化发布流程：
 * 1. 自动增加补丁版本号 (2.2.1 -> 2.2.2)
 * 2. 更新 package.json 中的版本号
 * 3. 创建发布提交
 * 4. 添加版本标签
 * 5. 推送到 GitHub
 * 6. (可选) 本地构建Windows应用
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 询问是否在本地构建
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 获取当前版本号
const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const currentVersion = packageJson.version;

console.log(`当前版本: ${currentVersion}`);

// 自动计算新版本号 (增加补丁版本)
const [major, minor, patch] = currentVersion.split(".").map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;
console.log(`新版本号: ${newVersion}`);

// 主流程函数
async function main() {
  try {
    // 更新 package.json 中的版本号
    packageJson.version = newVersion;
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
    );
    console.log(`✅ 已更新 package.json 版本号至 ${newVersion}`);

    // 提交更改
    execSync("git add package.json");
    execSync(`git commit -m "chore: 发布 v${newVersion}"`);
    console.log("✅ 已创建版本提交");

    // 创建标签
    const tagName = `v${newVersion}`;
    execSync(`git tag ${tagName}`);
    console.log(`✅ 已创建标签 ${tagName}`);

    // 询问是否在本地构建Windows应用
    const buildLocally = await new Promise((resolve) => {
      rl.question("是否在本地构建Windows应用? (y/N): ", (answer) => {
        resolve(answer.toLowerCase() === "y");
      });
    });

    if (buildLocally) {
      console.log("\n开始构建Windows应用...");
      execSync("pnpm run build:win", { stdio: "inherit" });
      console.log("✅ Windows应用构建完成");

      // 显示构建的文件
      const releaseDir = path.resolve(__dirname, `../release/${newVersion}`);
      if (fs.existsSync(releaseDir)) {
        console.log("\n构建文件:");
        const files = fs.readdirSync(releaseDir);
        files.forEach((file) => {
          const filePath = path.join(releaseDir, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`- ${file} (${sizeInMB} MB)`);
          }
        });
      }

      console.log("\n您可以手动创建GitHub Release并上传这些文件，或者");
    }

    // 推送到远程仓库
    console.log("\n是否推送更改到GitHub? (y/N): ");
    const shouldPush = await new Promise((resolve) => {
      rl.question("", (answer) => {
        resolve(answer.toLowerCase() === "y");
      });
    });

    if (shouldPush) {
      console.log("正在推送到 GitHub...");
      execSync("git push");
      execSync("git push --tags");
      console.log("✅ 已推送到 GitHub");

      console.log(`
🎉 发布流程已完成！
GitHub Actions 现在应该会自动开始构建并发布 v${newVersion}。
您可以在这里查看构建状态: https://github.com/tanghaochen/electron-vite-react/actions
`);
    } else {
      console.log(`
✅ 本地版本更新已完成，但未推送到GitHub。
您可以稍后手动推送:

git push
git push --tags
`);
    }
  } catch (error) {
    console.error("发布过程中出错:", error.message);
  } finally {
    rl.close();
  }
}

// 执行主流程
main();
