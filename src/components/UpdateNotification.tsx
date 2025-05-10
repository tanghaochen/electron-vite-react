import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  Snackbar,
  Paper,
} from "@mui/material";
import UpdateIcon from "@mui/icons-material/Update";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface UpdateInfo {
  update: boolean;
  version: string;
  newVersion: string;
}

interface ProgressInfo {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(
    null,
  );
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // 检查更新
  const checkForUpdates = async () => {
    setChecking(true);
    setUpdateError(null);

    try {
      await window.electronAPI.invoke("check-update");
    } catch (error) {
      console.error("检查更新失败:", error);
      setUpdateError(typeof error === "string" ? error : "检查更新失败");
    } finally {
      setChecking(false);
    }
  };

  // 下载更新
  const downloadUpdate = async () => {
    setDownloading(true);
    setUpdateError(null);
    setProgress(null);

    try {
      await window.electronAPI.invoke("start-download");
    } catch (error) {
      console.error("下载更新失败:", error);
      setUpdateError(typeof error === "string" ? error : "下载更新失败");
      setDownloading(false);
    }
  };

  // 安装更新
  const installUpdate = async () => {
    try {
      await window.electronAPI.invoke("quit-and-install");
    } catch (error) {
      console.error("安装更新失败:", error);
      setUpdateError(typeof error === "string" ? error : "安装更新失败");
    }
  };

  // 关闭Snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    // 当组件挂载时，设置事件监听
    const handleUpdateAvailable = (info: UpdateInfo) => {
      setUpdateAvailable(info);
      if (info.update) {
        setSnackbarOpen(true);
      }
    };

    const handleDownloadProgress = (progressInfo: ProgressInfo) => {
      setProgress(progressInfo);
    };

    const handleUpdateError = (error: { message: string }) => {
      setUpdateError(error.message);
      setDownloading(false);
    };

    const handleUpdateDownloaded = () => {
      setUpdateDownloaded(true);
      setDownloading(false);
    };

    // 注册事件监听器
    window.electronAPI.receive("update-can-available", handleUpdateAvailable);
    window.electronAPI.receive("download-progress", handleDownloadProgress);
    window.electronAPI.receive("update-error", handleUpdateError);
    window.electronAPI.receive("update-downloaded", handleUpdateDownloaded);

    // 自动检查更新
    checkForUpdates();

    // 清理函数
    return () => {
      window.electronAPI.removeAllListeners("update-can-available");
      window.electronAPI.removeAllListeners("download-progress");
      window.electronAPI.removeAllListeners("update-error");
      window.electronAPI.removeAllListeners("update-downloaded");
    };
  }, []);

  // 如果没有更新或未检查，不显示任何内容
  if (!updateAvailable || !updateAvailable.update) {
    return null;
  }

  return (
    <>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          sx={{ width: "100%" }}
        >
          发现新版本 {updateAvailable.newVersion} 可用
        </Alert>
      </Snackbar>

      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          p: 2,
          width: 320,
          zIndex: 9999,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <UpdateIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">发现新版本</Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          当前版本: {updateAvailable.version}
          <br />
          最新版本: {updateAvailable.newVersion}
        </Typography>

        {updateError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {updateError}
          </Alert>
        )}

        {downloading && progress && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress.percent}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption">
              {Math.round(progress.percent)}% 已下载 (
              {(progress.transferred / 1024 / 1024).toFixed(2)} MB /{" "}
              {(progress.total / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          </Box>
        )}

        {updateDownloaded ? (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CheckCircleOutlineIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              更新已下载，准备安装
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={installUpdate}
            >
              立即安装
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            {checking ? (
              <Button disabled>检查中...</Button>
            ) : downloading ? (
              <Button disabled variant="outlined">
                下载中...
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={downloadUpdate}
                disabled={downloading}
              >
                下载更新
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </>
  );
};

export default UpdateNotification;
