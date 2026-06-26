import AsyncStorage from '@react-native-async-storage/async-storage';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  message: string;
  time: string;
}

const MAX_LOGS = 500;
const STORAGE_KEY = 'runtime_logs';

class RuntimeLogger {
  private logs: LogEntry[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.logs = JSON.parse(raw) as LogEntry[];
      }
    } catch { /* ignore */ }
    this.initialized = true;
  }

  private async save(): Promise<void> {
    try {
      const trimmed = this.logs.slice(-MAX_LOGS);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }

  private log(level: LogLevel, module: string, message: string, error?: unknown): void {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const errMsg = error instanceof Error ? error.message : '';
    const fullMsg = `[${module}] ${message}${errMsg ? ` - ${errMsg}` : ''}`;
    const entry: LogEntry = { level, message: fullMsg, time };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) this.logs = this.logs.slice(-MAX_LOGS);
    void this.save();
  }

  debug(module: string, message: string, error?: unknown): void { this.log('DEBUG', module, message, error); }
  info(module: string, message: string, error?: unknown): void { this.log('INFO', module, message, error); }
  warn(module: string, message: string, error?: unknown): void { this.log('WARN', module, message, error); }
  error(module: string, message: string, error?: unknown): void { this.log('ERROR', module, message, error); }

  getLogs(): LogEntry[] { return [...this.logs]; }

  async clear(): Promise<void> {
    this.logs = [];
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const runtimeLogger = new RuntimeLogger();

// Initialize on import
void runtimeLogger.init();
