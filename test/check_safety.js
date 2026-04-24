const { test, expect } = require('@playwright/test');

test.describe('Flow Logic & Safety Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 假設專案在根目錄
    await page.goto('file://' + process.cwd() + '/index.html');
  });

  test('當視窗失去焦點時應觸發緊急停機', async ({ page }) => {
    // 1. 模擬按下前進鍵
    await page.keyboard.down('ArrowUp');
    
    // 2. 驗證日誌中出現「發送指令」
    const log = page.locator('#event-log');
    await expect(log).toContainText('發送指令: ArrowUp');

    // 3. 模擬失去焦點 (觸發 blur)
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));

    // 4. 驗證日誌中出現緊急停機訊息
    await expect(log).toContainText('緊急停機');
    
    // 5. 驗證狀態點變回預設
    const dot = page.locator('#status-dot');
    await expect(dot).not.toHaveClass(/active/);
  });

  test('多按鍵合成邏輯驗證', async ({ page }) => {
    // 按下 W 和 D (前進 + 右轉)
    await page.keyboard.down('ArrowUp');
    await page.keyboard.down('ArrowRight');
    
    const log = page.locator('#event-log');
    await expect(log).toContainText('ArrowUp + ArrowRight');
  });

  test('定時器累積與洩漏測試', async ({ page }) => {
    const log = page.locator('#event-log');
    const intervalInput = page.locator('#interval-input');
    
    // 設定較快的頻率
    await intervalInput.fill('50');
    
    // 模擬快速連續點擊 W 鍵
    for (let i = 0; i < 5; i++) {
        await page.keyboard.down('ArrowUp');
        await page.waitForTimeout(20);
        await page.keyboard.up('ArrowUp');
        await page.waitForTimeout(20);
    }
    
    // 重新開始發送
    await page.keyboard.down('ArrowUp');
    
    // 等待 200ms
    await page.waitForTimeout(200);
    
    // 獲取所有日誌條目
    const entries = await page.locator('.log-entry.command').count();
    
    // 如果邏輯正確，50ms 頻率下 200ms 應該發送約 4-5 次指令
    // 如果有定時器洩漏，次數會大幅增加
    expect(entries).toBeLessThan(15);
    expect(entries).toBeGreaterThan(0);
  });
});
