import { app } from "electron";
import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export class ImageManager {
  private userDataPath: string;
  private imagesDir: string;

  constructor() {
    this.userDataPath = app.getPath("userData");
    this.imagesDir = path.join(this.userDataPath, "images");
    this.ensureImageDirectory();
  }

  private ensureImageDirectory() {
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  private generateFilename(imageUrl: string): {
    filename: string;
    localPath: string;
  } {
    const urlHash = require("crypto")
      .createHash("md5")
      .update(imageUrl)
      .digest("hex");

    let fileExt = ".jpg"; // 默认扩展名
    try {
      fileExt = path.extname(new URL(imageUrl).pathname) || ".jpg";
    } catch (error) {
      console.warn("无法从URL解析文件扩展名，使用默认值:", error);
    }

    const filename = `${urlHash}${fileExt}`;
    const localPath = path.join(this.imagesDir, filename);

    return { filename, localPath };
  }

  async downloadImage(imageUrl: string): Promise<string> {
    try {
      // 为图片生成唯一文件名和本地路径
      const { localPath } = this.generateFilename(imageUrl);

      // 检查文件是否已存在，避免重复下载
      if (fs.existsSync(localPath)) {
        console.log(`图片已存在，直接返回本地路径: ${localPath}`);
        return localPath;
      }

      // 使用Electron的net模块下载图片
      const { net } = require("electron");
      const response = await net.fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) throw new Error(`下载失败: ${response.status}`);

      // 将响应转换为Buffer并写入文件
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(localPath, buffer);

      console.log(`图片已下载到: ${localPath}`);
      return localPath;
    } catch (error) {
      console.error("下载图片失败:", error);
      throw error;
    }
  }
}
