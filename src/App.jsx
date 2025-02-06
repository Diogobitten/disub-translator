import React, { useState, useEffect, useRef } from 'react';
import { FaCloudUploadAlt, FaMoon, FaSun, FaCheckCircle } from 'react-icons/fa';


export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('pt');
  const [apiKey, setApiKey] = useState('google_v1');
  const [customApiKey, setCustomApiKey] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [funnyMessage, setFunnyMessage] = useState('');
  const intervalRef = useRef(null);
  const controllerRef = useRef(null);


  const BACKEND_URL = 'http://127.0.0.1:5000';

  const listenToProgress = () => {
    const eventSource = new EventSource(`${BACKEND_URL}/progress`);
  
    eventSource.onmessage = (event) => {
      const newProgress = parseInt(event.data);
  
      // Garante que o progresso nunca diminua
      setProgress((prevProgress) => {
        return newProgress > prevProgress ? newProgress : prevProgress;
      });
    };
  
    eventSource.onerror = () => {
      eventSource.close();
    };
  };

  
  const funnyMessages = [
    { message: 'Contratando alienígenas para traduzir...', gif: 'https://media.giphy.com/media/13ea4eXuOuQsmY/giphy.gif?cid=ecf05e47mq8dyz9575rja7iqlh486rniy57p2ev2l52dsyfv&ep=v1_gifs_search&rid=giphy.gif&ct=g' },
    { message: 'Consultando o Oráculo do Google...', gif: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif' },
    { message: 'Pedindo ajuda para um papagaio poliglota...', gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdndpM3dxZXRjMXJxZmp3NGVzZWx4dzUxN2VneGltNXA2aGJpbGM5dyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/EZ8u1MFn2r1o921oiZ/giphy.gif' },
    { message: 'Ligando para um amigo internacional...', gif: 'https://media.giphy.com/media/yPhqlJccIOaru/giphy.gif?cid=790b7611gbl0vow7ejsadp92p30gsvohthdgjjy3mogsbnmj&ep=v1_gifs_search&rid=giphy.gif&ct=g' },
    { message: 'Traduzindo com sotaque, só pra dar um charme...', gif: 'https://media.giphy.com/media/3o7qDEq2bMbcbPRQ2c/giphy.gif' },
    { message: 'Desenhando cada palavra à mão...', gif: 'https://media.giphy.com/media/JC0E0Wo0m71cqO8KzO/giphy.gif?cid=790b7611hcsxw0t0qo954od30i5hherjbgewpnhirzw2kbfj&ep=v1_gifs_search&rid=giphy.gif&ct=g' },
    { message: 'Perguntando para um robô poliglota...', gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbjM1dzdscmcyOGk0djcxZWx1ZmdsdnQ2NGtmcGRteWUweXBrNG9laCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/IZY2SE2JmPgFG/giphy.gif' },
    { message: 'Traduzindo... quase lá, paciência é uma virtude!', gif: 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif' },
    { message: '2000 anos depois...', gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2wzNWo0c2o2ajBrdTllbzlmZ2t2anRlcDl2eTR5ZWVwOTNkY2FwdCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/p5Wi5ilxVhCI10PrC4/giphy.gif' },
    { message: 'Executar a ordem 66...ops! não, não é isso...', gif: 'https://media.giphy.com/media/MYjD5GZDTwiZy/giphy.gif?cid=790b7611l4lit4krzxldhyixyvzkrse19mv8bl7u0liewcy5&ep=v1_gifs_search&rid=giphy.gif&ct=g' },
    { message: 'Se reclamar é..vida longa ao rei...', gif: 'https://media.giphy.com/media/tMmUDwr0RCgog/giphy.gif?cid=790b76113s9mcov5ccpzccyu57urc2z5kmmtkt16sh4exxg5&ep=v1_gifs_search&rid=giphy.gif&ct=g' },
    { message: 'Você nunca teve uma amigo assim...', gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMW5scHI5bXlyc3c1MzZ2ejF4OTVpY3ZscHM4eGVrNDRnM3hwbnJiZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/T5MvalD01r2XS/giphy.gif' },
    { message: 'Já fazem 84 anos...', gif: 'https://media.giphy.com/media/FoH28ucxZFJZu/giphy.gif?cid=790b7611fjrz2ns39djs1i218lic0rnn0x33xli6f915t2rf&ep=v1_gifs_search&rid=giphy.gif&ct=g' },
    { message: 'É por ai..', gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdDYyenZkeG13aXR1dWw3amt5bWUwYnM3Yndha3BqeDQ4c2JzNml1YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/6UFgdU9hirj1pAOJyN/giphy.gif' },
    { message: 'Mais que um tradutor..Family..', gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHRreTBrcHExcW11dmVnMnJnNzdsMGxhcDhvcmxxdzQxa3p0OHg1bSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/amg2hcfGDkKt4Q3DpF/giphy.gif' },
    { message: 'Já chega!..desonra!..desonra pra tu! desonra pra tua vaca!..', gif: 'https://media.giphy.com/media/ZStO2grL3lzBm/giphy.gif?cid=790b7611n65kpy8b80o2mwn6kcqbgx46qcutlirfqhyawlx3&ep=v1_gifs_search&rid=giphy.gif&ct=g' },
    { message: 'Legendando..o necessário..legendando o necessáiro..o extraordinário é demais..', gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExamlmdGQwcXFkMjlxOGgwY3J3NzB5OGIwOHY4cDVxZHdwMjdhOGp1biZlcD12MV9naWZzX3NlYXJjaCZjdD1n/oQIghQgiGwSbu/giphy.gif' },
    { message: 'Tá acabando..', gif: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmd6N3dwd2pzaDY4OG1mbzJxNnk1NGdvbG50ZXpvMHNsNHJlMDNuZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/37Fsl1eFxbhtu/giphy.gif' }
  ];

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', JSON.stringify(newMode)); // Salva o estado no localStorage
      document.documentElement.classList.toggle('dark', newMode); // Aplica a classe 'dark' ao HTML
      return newMode;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]); // Garante que a classe seja aplicada sempre que o modo for alterado



  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.srt')) {
      setFile(selectedFile);
      setUploadSuccess(true);
      console.log(`Arquivo carregado: ${selectedFile.name}`);
    } else {
      alert('Por favor, envie um arquivo SRT válido.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.srt')) {
      setFile(droppedFile);
      setUploadSuccess(true);
      console.log(`Arquivo arrastado: ${droppedFile.name}`);
    } else {
      alert('Por favor, envie um arquivo SRT válido.');
    }
  };

const startFunnyMessages = () => {
  const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
  setFunnyMessage(randomMessage); // Agora armazena o objeto completo
  intervalRef.current = setInterval(() => {
    const newMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
    setFunnyMessage(newMessage);
  }, 10000);
};

  const stopFunnyMessages = () => {
    clearInterval(intervalRef.current);
  };

  const handleDownload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('api_key', apiKey);
  
      if (apiKey !== 'google_v1') {
        formData.append('custom_api_key', customApiKey);
      }
  
      setLoading(true);
      setProgress(0); // Resetar o progresso
      startFunnyMessages();
      listenToProgress();
      controllerRef.current = new AbortController();
  
      try {
        const response = await fetch(`${BACKEND_URL}/translate`, {
          method: 'POST',
          body: formData,
          signal: controllerRef.current.signal,
        });
  
        if (!response.ok) {
          throw new Error('Erro ao traduzir o arquivo.');
        }
  
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `translated_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
  
        // 🟢 Resetar o campo de upload após o download
        setTimeout(() => {
          setFile(null); // Reseta o estado do arquivo
          setUploadSuccess(false); // Indica que o upload precisa ser feito novamente
          setFunnyMessage(''); // Remove a mensagem engraçada
          setProgress(0); // Reseta o progresso
          document.getElementById("fileInput").value = ""; // Reseta o input de upload
        }, 500);
  
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Tradução cancelada pelo usuário.');
        } else {
          console.error('Erro:', error);
          alert('Erro ao traduzir o arquivo.');
        }
      } finally {
        setLoading(false);
        stopFunnyMessages();
      }
    } else {
      alert('Por favor, envie um arquivo SRT.');
    }
  };

  const handleCancel = async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  
    stopFunnyMessages();
    setLoading(false);
    setProgress(0);
    setFunnyMessage('Tradução cancelada!');
  
    // Enviar a requisição para o backend cancelar o processo
    try {
      await fetch(`${BACKEND_URL}/cancel`, { method: 'POST' });
      console.log('❌ Requisição de cancelamento enviada para o backend.');
    } catch (error) {
      console.error('Erro ao enviar requisição de cancelamento:', error);
    }
  };

  return (
    <div className={`w-screen h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} transition-colors duration-500`}>
      <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-500 mx-4 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-center">DiSub</h1>
          <button onClick={toggleDarkMode} className="p-2 rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition">
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-500 ${uploadSuccess ? 'border-green-500 bg-green-100 text-green-800' : dragActive ? 'border-blue-500 bg-blue-100 text-blue-800' : darkMode ? 'border-gray-400 bg-gray-800 hover:bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <label className="flex flex-col items-center justify-center w-full h-full">
              {uploadSuccess ? (
                <div className="flex flex-col items-center justify-center">
                  <FaCheckCircle className="text-3xl text-green-600 mb-2" />
                  <p className="text-sm font-semibold">Arquivo Recebido!</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaCloudUploadAlt className={`text-3xl mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                  <p className="mb-2 text-sm font-semibold">Clique para enviar ou arraste e solte</p>
                  <p className="text-xs">Arquivo SRT</p>
                </div>
              )}
              <input id="fileInput" type="file" className="hidden" accept=".srt" onChange={handleFileChange} />
            </label>
          </div>

          <div>
            <label>Escolha o idioma</label>
            <select className={`w-full py-2 px-3 border rounded-md ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'}`} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">Inglês</option>
              <option value="es">Espanhol</option>
              <option value="fr">Francês</option>
              <option value="de">Alemão</option>
              <option value="pt">Português</option>
            </select>
          </div>

          <div>
            <label>Escolha a API</label>
            <select className={`w-full py-2 px-3 border rounded-md ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'}`} value={apiKey} onChange={(e) => setApiKey(e.target.value)}>
              <option value="google_v1">Google Translate V1 (Padrão)</option>
              <option value="google">Google Translate API</option>
              <option value="microsoft">Microsoft Translator API</option>
              <option value="deepl">DeepL API</option>
              <option value="chatgpt">ChatGPT API</option>
            </select>
          </div>

          {(apiKey !== 'google_v1') && (
            <div>
              <label className="block mb-1 font-semibold">Insira sua API Key</label>
              <input
                type="text"
                className={`w-full py-2 px-3 border rounded-md ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'}`}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Cole sua API Key aqui"
              />
            </div>
          )}

          {loading && (
            <div className="w-full bg-gray-300 rounded-full h-2.5 mb-2 dark:bg-gray-700">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          )}

          <div className="flex justify-between space-x-2">
            <button
              type="button"
              onClick={handleDownload}
              className={`w-full py-2 px-4 rounded-md ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
              disabled={loading}
            >
              {loading ? 'Traduzindo...' : 'Baixar Arquivo Traduzido'}
            </button>

            {loading && (
              <button
                type="button"
                onClick={handleCancel}
                className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Cancelar
              </button>
            )}
          </div>

            {loading && funnyMessage && (
              <div className="text-center mt-4">
                <p className="text-sm italic mb-2">{funnyMessage.message}</p>
                <img src={funnyMessage.gif} alt="GIF engraçado" className="mx-auto rounded-md w-48 h-48 object-cover" />
              </div>
            )}

        </form>
      </div>
    </div>
  );
}
