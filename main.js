const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let pythonBackend;

function waitForFlaskServer(port, callback) {
  const interval = setInterval(() => {
    const client = new net.Socket();
    client
      .connect({ port: port }, () => {
        clearInterval(interval);
        client.destroy();
        callback();
      })
      .on('error', () => {
        client.destroy();
      });
  }, 1000);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, 'build', 'index.html'));
}

app.whenReady().then(() => {
  const isPackaged = app.isPackaged;

  // Corrigindo o caminho do Python para ambiente empacotado
  const pythonCommand = isPackaged 
    ? path.join(process.resourcesPath, 'backend', 'venv', 'Scripts', 'python.exe') 
    : path.join(__dirname, 'backend', 'venv', 'Scripts', 'python.exe');

  const backendScript = isPackaged 
    ? path.join(process.resourcesPath, 'backend', 'app.py') 
    : path.join(__dirname, 'backend', 'app.py');

  console.log(`✅ Iniciando o backend com: ${pythonCommand}`);

  pythonBackend = spawn(pythonCommand, [backendScript], { 
    detached: true, 
    stdio: 'ignore'
  });

  

  console.log('🚀 Aguardando o servidor Flask iniciar na porta 5000...');

  waitForFlaskServer(5000, () => {
    console.log('✅ Conectado ao servidor Flask na porta 5000!');
    createWindow();
  });
});

// Quando todas as janelas forem fechadas, encerrar o app
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Encerrar o servidor Flask quando o app for fechado
app.on('before-quit', () => {
  if (pythonBackend) {
    console.log('❌ Encerrando servidor Flask...');
    pythonBackend.kill();
  }
});
