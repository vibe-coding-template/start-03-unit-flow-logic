/**
 * 指令流邏輯：單次觸發與重複發送 (Flow Logic: Interval & Safety)
 * 
 * 任務：
 * 1. 實作 startFlow / stopFlow 確保定時器不會重複啟動
 * 2. 實作多按鍵狀態聚合 (keysActive)
 * 3. 實作失效安全 (Dead Man's Switch) 監聽 window.blur
 */

// --- 狀態定義 ---
let flowInterval = null;
let currentIntervalMs = 100;
const keysActive = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// --- DOM 元素 ---
const logContainer = document.getElementById('event-log');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const intervalInput = document.getElementById('interval-input');
const clearLogBtn = document.getElementById('clear-log');
const ctrlButtons = document.querySelectorAll('.ctrl-btn');

// --- 日誌工具 ---
function addLog(message, type = 'system') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false, fractionDigits: 3 });
    entry.textContent = `[${time}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// --- 核心邏輯：指令發送 ---
function sendCommand() {
    // TODO: 任務 2 - 根據 keysActive 合成最終指令
    const active = Object.keys(keysActive).filter(k => keysActive[k]);
    
    if (active.length === 0) {
        addLog("IDLE (無按鍵按下)", "system");
        return;
    }

    const command = active.join(' + ');
    addLog(`發送指令: ${command}`, "command");
}

// --- 核心邏輯：流量控制 ---
function startFlow() {
    // TODO: 任務 1 - 檢查 flowInterval 是否已存在，避免重複啟動
    if (flowInterval) return;

    currentIntervalMs = parseInt(intervalInput.value) || 100;
    addLog(`啟動指令流 (頻率: ${currentIntervalMs}ms)`, "system");
    
    statusDot.className = 'dot active';
    statusText.textContent = '傳輸中...';

    // 立即發送一次，然後開始循環
    sendCommand();
    flowInterval = setInterval(sendCommand, currentIntervalMs);
}

function stopFlow() {
    // TODO: 任務 1 - 清除定시器並歸零狀態
    if (flowInterval) {
        clearInterval(flowInterval);
        flowInterval = null;
        addLog("停止指令流", "stop");
        
        statusDot.className = 'dot';
        statusText.textContent = '系統就緒';
    }
}

// --- 任務 3：失效安全 (Dead Man's Switch) ---
function emergencyStop() {
    addLog("!!! 安全機制觸發：緊急停機 !!!", "safety");
    // TODO: 重置所有按鍵狀態並停止指令流
    for (const key in keysActive) {
        keysActive[key] = false;
    }
    document.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
    stopFlow();
}

// --- 事件監聽 ---

// 按鍵按下
window.addEventListener('keydown', (e) => {
    if (keysActive.hasOwnProperty(e.code) && !keysActive[e.code]) {
        keysActive[e.code] = true;
        const btn = document.querySelector(`.ctrl-btn[data-key="${e.code}"]`);
        if (btn) btn.classList.add('active');
        startFlow();
    }
});

// 按鍵放開
window.addEventListener('keyup', (e) => {
    if (keysActive.hasOwnProperty(e.code)) {
        keysActive[e.code] = false;
        const btn = document.querySelector(`.ctrl-btn[data-key="${e.code}"]`);
        if (btn) btn.classList.remove('active');
        
        // 如果沒有任何按鍵按下，停止指令流
        if (!Object.values(keysActive).some(v => v)) {
            stopFlow();
        }
    }
});

// 滑鼠操作
ctrlButtons.forEach(btn => {
    const key = btn.getAttribute('data-key');
    
    btn.addEventListener('mousedown', () => {
        if (!keysActive[key]) {
            keysActive[key] = true;
            btn.classList.add('active');
            startFlow();
        }
    });

    btn.addEventListener('mouseup', () => {
        keysActive[key] = false;
        btn.classList.remove('active');
        if (!Object.values(keysActive).some(v => v)) {
            stopFlow();
        }
    });

    btn.addEventListener('mouseleave', () => {
        if (keysActive[key]) {
            keysActive[key] = false;
            btn.classList.remove('active');
            if (!Object.values(keysActive).some(v => v)) {
                stopFlow();
            }
        }
    });
});

// TODO: 任務 3 - 監聽視窗失去焦點
window.addEventListener('blur', emergencyStop);
window.addEventListener('visibilitychange', () => {
    if (document.hidden) emergencyStop();
});

// 其他
clearLogBtn.addEventListener('click', () => {
    logContainer.innerHTML = '<div class="log-entry system">日誌已清除</div>';
});

intervalInput.addEventListener('change', () => {
    if (flowInterval) {
        addLog("頻率變更，重啟定時器", "system");
        stopFlow();
        startFlow();
    }
});
