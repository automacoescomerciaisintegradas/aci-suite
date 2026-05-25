import path from 'path';
import net from 'net';
import { spawn, type ChildProcess } from 'child_process';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const BACKEND_PORT = 4001;

function canConnectToPort(port: number, host = '127.0.0.1', timeoutMs = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const finish = (result: boolean) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

function ensureBackendRunningPlugin() {
  let backendChild: ChildProcess | null = null;

  return {
    name: 'ensure-backend-running',
    async configureServer(server: any) {
      const shouldAutoStart = process.env.VITE_AUTO_START_BACKEND !== 'false';
      if (!shouldAutoStart) return;

      const backendUp = await canConnectToPort(BACKEND_PORT);
      if (backendUp) return;

      const command = process.platform === 'win32' ? 'npm run server' : 'npm run server';
      backendChild = spawn(command, {
        cwd: process.cwd(),
        shell: true,
        stdio: 'inherit',
      });

      console.log(`\n[dev] Backend não estava ativo. Iniciando automaticamente em http://localhost:${BACKEND_PORT}\n`);

      server.httpServer?.once('close', () => {
        if (backendChild && !backendChild.killed) {
          backendChild.kill();
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    root: './',
    publicDir: 'public',
    build: {
      outDir: 'dist',
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:4001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react(), tailwindcss(), ensureBackendRunningPlugin()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
