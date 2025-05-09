import type { ProgressInfo } from "electron-updater";
import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/update/Modal";
import Progress from "@/components/update/Progress";
import "./update.css";

const Update = () => {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>();
  const [updateError, setUpdateError] = useState<ErrorType>();
  const [progressInfo, setProgressInfo] = useState<Partial<ProgressInfo>>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalBtn, setModalBtn] = useState<{
    cancelText?: string;
    okText?: string;
    onCancel?: () => void;
    onOk?: () => void;
  }>({
    onCancel: () => setModalOpen(false),
    onOk: () => window.electronAPI?.invoke("start-download"),
  });

  const checkUpdate = async () => {
    setChecking(true);
    try {
      /**
       * @type {import('electron-updater').UpdateCheckResult | null | { message: string, error: Error }}
       */
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke("check-update");
        setProgressInfo({ percent: 0 });
        setChecking(false);
        setModalOpen(true);
        if (result?.error) {
          setUpdateAvailable(false);
          setUpdateError(result?.error);
        }
      } else {
        console.warn("electronAPI 未找到，无法检查更新");
        setChecking(false);
      }
    } catch (error) {
      console.error("检查更新时出错:", error);
      setChecking(false);
    }
  };

  const onUpdateCanAvailable = useCallback((arg1: VersionInfo) => {
    setVersionInfo(arg1);
    setUpdateError(undefined);
    // 可以更新
    if (arg1.update) {
      setModalBtn((state) => ({
        ...state,
        cancelText: "取消",
        okText: "更新",
        onOk: () => window.electronAPI?.invoke("start-download"),
      }));
      setUpdateAvailable(true);
    } else {
      setUpdateAvailable(false);
    }
  }, []);

  const onUpdateError = useCallback((arg1: ErrorType) => {
    setUpdateAvailable(false);
    setUpdateError(arg1);
  }, []);

  const onDownloadProgress = useCallback((arg1: ProgressInfo) => {
    setProgressInfo(arg1);
  }, []);

  const onUpdateDownloaded = useCallback((...args: any[]) => {
    setProgressInfo({ percent: 100 });
    setModalBtn((state) => ({
      ...state,
      cancelText: "稍后",
      okText: "立即安装",
      onOk: () => window.electronAPI?.invoke("quit-and-install"),
    }));
  }, []);

  useEffect(() => {
    // 确保 electronAPI 存在
    if (window.electronAPI) {
      try {
        // 注册事件监听器
        window.electronAPI.receive(
          "update-can-available",
          onUpdateCanAvailable,
        );
        window.electronAPI.receive("update-error", onUpdateError);
        window.electronAPI.receive("download-progress", onDownloadProgress);
        window.electronAPI.receive("update-downloaded", onUpdateDownloaded);

        // 返回清理函数
        return () => {
          // 移除所有监听器
          window.electronAPI.removeAllListeners("update-can-available");
          window.electronAPI.removeAllListeners("update-error");
          window.electronAPI.removeAllListeners("download-progress");
          window.electronAPI.removeAllListeners("update-downloaded");
        };
      } catch (error) {
        console.error("设置更新监听器时出错:", error);
      }
    }
    return undefined;
  }, []);

  return (
    <>
      <Modal
        open={modalOpen}
        cancelText={modalBtn?.cancelText}
        okText={modalBtn?.okText}
        onCancel={modalBtn?.onCancel}
        onOk={modalBtn?.onOk}
        footer={updateAvailable ? /* hide footer */ null : undefined}
      >
        <div className="modal-slot">
          {updateError ? (
            <div>
              <p>下载最新版本时出错。</p>
              <p>{updateError.message}</p>
            </div>
          ) : updateAvailable ? (
            <div>
              <div>最新版本是: v{versionInfo?.newVersion}</div>
              <div className="new-version__target">
                v{versionInfo?.version} -&gt; v{versionInfo?.newVersion}
              </div>
              <div className="update__progress">
                <div className="progress__title">更新进度:</div>
                <div className="progress__bar">
                  <Progress percent={progressInfo?.percent}></Progress>
                </div>
              </div>
            </div>
          ) : (
            <div className="can-not-available">
              {JSON.stringify(versionInfo ?? {}, null, 2)}
            </div>
          )}
        </div>
      </Modal>
      <button disabled={checking} onClick={checkUpdate}>
        {checking ? "检查中..." : "检查更新"}
      </button>
    </>
  );
};

export default Update;
