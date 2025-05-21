from vosk import Model, KaldiRecognizer
import sounddevice as sd
import queue
import json

model = Model("vosk-model-small-cn-0.22")  # 确保模型解压在此目录
samplerate = 16000
q = queue.Queue()

def callback(indata, frames, time, status):
    if status:
        print(status)
    q.put(bytes(indata))

# 打开麦克风
with sd.RawInputStream(samplerate=samplerate, blocksize=8000, dtype='int16',
                       channels=1, callback=callback):
    print("请说中文指令（如：上、下、左、右）：")
    rec = KaldiRecognizer(model, samplerate)

    while True:
        data = q.get()
        if rec.AcceptWaveform(data):
            result = json.loads(rec.Result())
            text = result.get("text", "")
            if text:
                print("识别到指令：", text)
