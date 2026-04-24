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

function hasActiveKeys() {
    return Object.values(keysActive).some(Boolean);
}

function updateStatus(isActive) {
    statusDot.className = isActive ? 'dot active' : 'dot';
    statusText.textContent = isActive ? '傳輸中...' : '系統就緒';
}

// --- 核心邏輯：指令發送 ---
function sendCommand() {
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
    if (flowInterval) return;

    currentIntervalMs = parseInt(intervalInput.value) || 100;
    addLog(`啟動指令流 (頻率: ${currentIntervalMs}ms)`, "system");
    updateStatus(true);

    // 立即發送一次，然後開始循環
    sendCommand();
    flowInterval = setInterval(sendCommand, currentIntervalMs);
}

function stopFlow() {
    if (flowInterval) {
        clearInterval(flowInterval);
        flowInterval = null;
        addLog("停止指令流", "stop");
    }

    updateStatus(false);
}

function syncFlow({ sendImmediate = false } = {}) {
    if (hasActiveKeys()) {
        if (flowInterval) {
            if (sendImmediate) sendCommand();
            return;
        }

        startFlow();
        return;
    }

    stopFlow();
}

// --- 任務 3：失效安全 (Dead Man's Switch) ---
function emergencyStop() {
    if (!hasActiveKeys() && !flowInterval) return;

    for (const key in keysActive) {
        keysActive[key] = false;
    }

    ctrlButtons.forEach((btn) => btn.classList.remove('active'));

    addLog("!!! 安全機制觸發：緊急停機 !!!", "safety");
    addLog("發送指令: STOP", "stop");
    stopFlow();
}

// --- 事件監聽 ---

// 按鍵按下
window.addEventListener('keydown', (e) => {
    if (keysActive.hasOwnProperty(e.code) && !keysActive[e.code]) {
        keysActive[e.code] = true;
        const btn = document.querySelector(`.ctrl-btn[data-key="${e.code}"]`);
        if (btn) btn.classList.add('active');
        syncFlow({ sendImmediate: true });
    }
});

// 按鍵放開
window.addEventListener('keyup', (e) => {
    if (keysActive.hasOwnProperty(e.code)) {
        keysActive[e.code] = false;
        const btn = document.querySelector(`.ctrl-btn[data-key="${e.code}"]`);
        if (btn) btn.classList.remove('active');

        syncFlow({ sendImmediate: true });
    }
});

// 滑鼠操作
ctrlButtons.forEach(btn => {
    const key = btn.getAttribute('data-key');
    
    btn.addEventListener('mousedown', () => {
        if (!keysActive[key]) {
            keysActive[key] = true;
            btn.classList.add('active');
            syncFlow({ sendImmediate: true });
        }
    });

    btn.addEventListener('mouseup', () => {
        keysActive[key] = false;
        btn.classList.remove('active');
        syncFlow({ sendImmediate: true });
    });

    btn.addEventListener('mouseleave', () => {
        if (keysActive[key]) {
            keysActive[key] = false;
            btn.classList.remove('active');
            syncFlow({ sendImmediate: true });
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
