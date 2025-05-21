from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

VALID_COMMANDS = {
    '上': 'up',
    '下': 'down',
    '左': 'left',
    '右': 'right',
    '前进': 'up',
    '后退': 'down',
    '左转': 'left',
    '右转': 'right',
    '停止': 'stop',
}

@app.route('/')
def index():
    return render_template('game.html')

@app.route('/command', methods=['POST'])
def handle_command():
    data = request.json
    command = data.get('command', '').lower()
    
    for chinese, english in VALID_COMMANDS.items():
        if chinese in command:
            return jsonify({'success': True, 'direction': english})
    
    return jsonify({'success': False, 'error': '无效指令'})

if __name__ == '__main__':
    app.run(debug=True)
