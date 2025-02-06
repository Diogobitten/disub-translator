from flask import Flask, request, send_file, jsonify, Response
from flask_cors import CORS
import sys
import openai
import os
import requests
import time
import threading
import traceback
import tempfile

# Definindo o diretório base dependendo do ambiente (empacotado ou desenvolvimento)
if getattr(sys, 'frozen', False):
    # Se o app estiver empacotado com PyInstaller
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Diretório para uploads
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configurar o console para UTF-8 (compatível com Windows)
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    # Para versões do Python que não possuem o método reconfigure
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

# Variável global para progresso da tradução
progress = 0

# Inicialização do Flask
app = Flask(__name__)
CORS(app)

# Variável global para controle de cancelamento
cancel_translation_event = threading.Event()


# OpenAI
def translate_with_chatgpt(text, target_language, api_key):
    client = openai.OpenAI(api_key=api_key)

    prompt = f"Traduza o seguinte texto para {target_language}:\n\n{text}"

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Altere para "gpt-3.5-turbo" se necessário
            messages=[
                {"role": "system", "content": "Você é um tradutor profissional."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        translated_text = response.choices[0].message.content.strip()
        print(f"🧠 Tradução ChatGPT: {translated_text}")
        return translated_text
    except Exception as e:
        print(f"❗ Erro inesperado: {e}")
        return None
    


# Função para traduzir usando o Google Translate V1
def translate_with_google_v1(text, target_language):
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "auto",
        "tl": target_language,
        "dt": "t",
        "q": text
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Lança erro se o status não for 200

        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            return ''.join([item[0] for item in data[0] if item[0]])
        else:
            print("❌ Estrutura inesperada da resposta:", data)
            return None
    except requests.RequestException as e:
        print("Erro de conexão com o Google Translate:", e)
        return None

@app.route('/translate', methods=['POST'])
def translate_srt():
    global progress
    cancel_translation_event.clear()
    progress = 0
    
    print("🚀 Requisição de tradução recebida!")

    try:
        
        file = request.files.get('file')
        language = request.form.get('language')
        api_key = request.form.get('api_key')
        custom_api_key = request.form.get('custom_api_key')  # Importante para o ChatGPT

        print(f"📥 API selecionada: {api_key}")
        print(f"📥 Idioma de destino: {language}")

        if not file or not language or not api_key:
            print("❌ Faltam informações obrigatórias.")
            return jsonify({'error': 'Faltam informações obrigatórias.'}), 400

        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        print(f"📁 Arquivo salvo em: {file_path}")

        translated_file_path = os.path.join(UPLOAD_FOLDER, f"translated_{file.filename}")

        with open(file_path, 'r', encoding='utf-8-sig') as src_file:
            lines = src_file.readlines()

        total_lines = len([line for line in lines if line.strip() and not line.strip().isdigit() and '-->' not in line])
        translated_lines = 0

        with open(translated_file_path, 'w', encoding='utf-8') as dest_file:
            for line in lines:
                if cancel_translation_event.is_set():
                    print("🚫 Tradução cancelada!")
                    return jsonify({'status': 'cancelled'}), 200

                clean_line = line.strip()

                if clean_line and not clean_line.isdigit() and '-->' not in clean_line:
                    print(f"🔤 Traduzindo linha: {clean_line[:30]}...")

                    try:
                        if api_key == 'google_v1':
                            translated_text = translate_with_google_v1(clean_line, language)
                        elif api_key == 'chatgpt':
                            print(f"🔑 Usando API Key do ChatGPT: {custom_api_key[:5]}***")
                            translated_text = translate_with_chatgpt(clean_line, language, custom_api_key)
                        else:
                            translated_text = f"[{language.upper()}] {clean_line}"

                        if translated_text:
                            dest_file.write(translated_text + '\n')
                        else:
                            print(f"⚠️ Falha na tradução, mantendo texto original: {clean_line}")
                            dest_file.write(line)
                    except Exception as line_error:
                        print(f"❗ Erro ao traduzir a linha '{clean_line[:30]}': {line_error}")
                        traceback.print_exc()  # Mostra o stack trace completo para o erro da linha
                        dest_file.write(line)

                    translated_lines += 1
                    progress = int((translated_lines / total_lines) * 100)
                else:
                    dest_file.write(line)

        progress = 100  # Garante que o progresso finalize em 100%
        print("✅ Tradução concluída!")
        return send_file(translated_file_path, as_attachment=True)

    except Exception as e:
        print(f"⚠️ Erro ao processar o arquivo: {e}")
        traceback.print_exc()  # Adiciona o stack trace completo para o erro geral
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500


@app.route('/progress')
def progress_stream():
    def generate():
        global progress
        while progress < 100:
            yield f"data: {progress}\n\n"
            time.sleep(0.5)  # Atualização a cada meio segundo
        yield f"data: 100\n\n"  # Finaliza com 100%

    return Response(generate(), mimetype='text/event-stream')

@app.route('/cancel', methods=['POST'])
def cancel_translation_process():
    cancel_translation_event.set()  # Aciona o evento de cancelamento
    print("❌ Tradução cancelada pelo usuário.")
    return jsonify({'status': 'cancelled'}), 200



# Rota de teste para verificar se o servidor está funcionando
@app.route('/')
def index():
    return jsonify({'status': 'Servidor Flask rodando!'})

# Rodar o servidor Flask
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)



