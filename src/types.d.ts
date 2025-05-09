// 定义 ElectronAPI 接口
interface ElectronAPI {
  send: (channel: string, data: any) => void;
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>;
  receive: (channel: string, func: (...args: any[]) => void) => void;
  receiveOnce: (channel: string, func: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

// 扩展全局窗口接口
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    // 保留旧接口以便兼容
    ipcRenderer?: {
      on: (channel: string, listener: (...args: any[]) => void) => any;
      send: (channel: string, ...args: any[]) => any;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

// 版本信息接口
interface VersionInfo {
  version: string;
  newVersion: string;
  update: boolean;
}

// 错误类型接口
interface ErrorType {
  message: string;
}

export {};
