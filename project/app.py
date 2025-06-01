from flask import Flask, render_template, jsonify, request
import threading
import queue
from vosk import Model, KaldiRecognizer
import sounddevice as sd
import json
import os
import wave

app = Flask(__name__)

# 初始化语音模型路径（注意修改为你本地模型路径）
model_path = os.path.join(os.path.dirname(__file__), "vosk-model-small-cn-0.22")
model = Model(model_path)
samplerate = 16000
q = queue.Queue()
latest_command = ""  # 全局变量，保存最新语音识别结果

# 音频数据输入回调
def callback(indata, frames, time, status):
    if status:
        print(status)
    q.put(bytes(indata))

# 后台线程识别函数
def vosk_loop():
    global latest_command
    with sd.RawInputStream(samplerate=samplerate, blocksize=8000, dtype='int16',
                           channels=1, callback=callback):
        print("🎤 离线语音识别已启动...")
        rec = KaldiRecognizer(model, samplerate)
        while True:
            data = q.get()
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                text = result.get("text", "").strip()
                if text:
                    latest_command = text
                    print("识别到语音指令：", text)

@app.route('/')
def index():
    return render_template('game.html')

@app.route('/status')
def status():
    global latest_command
    result = latest_command
    latest_command = ""  # 返回一次后清空，避免重复触发
    return jsonify({'command': result})

# 可选：favicon 避免控制台 404
@app.route('/favicon.ico')
def favicon():
    return "", 204

@app.route('/recognize', methods=['POST'])
def recognize():
    audio = request.files['audio']
    wf = wave.open(audio, 'rb')
    rec = KaldiRecognizer(model, wf.getframerate())
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        rec.AcceptWaveform(data)
    result = rec.FinalResult()
    text = json.loads(result).get('text', '')
    return jsonify({'text': text})

if __name__ == '__main__':
    # 启动后台线程
    t = threading.Thread(target=vosk_loop, daemon=True)
    t.start()
    app.run(debug=True)
