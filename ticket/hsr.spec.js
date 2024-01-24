import { test } from '@playwright/test'
import * as Captcha from '../utils/captcha';

const CAPTCHA_PATH = 'image/captcha.png';
const SETTING = {
    StartStation: '南港', // 南港
    DestinationStation: '左營', // 台北
    Date: '2024/01/30', // 2024/01/01
    Time: '08:00', // 00:00
    TicketCount: '1', // 1
    IdentityCode: 'A123456789', // A123456789
}

test.describe('hsr', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://irs.thsrc.com.tw/IMINT/?locale=tw');
        await page.goto('https://irs.thsrc.com.tw/IMINT/?wicket:interface=:0::');
    });

    test('buy', async ({ page }) => {
        await start(page);
    });
})

async function start(page) {
    // Cookie同意
    await page.getByRole('button', { name: '我同意' }).click();

    // 先做假查詢
    await page.getByRole('button', { name: '開始查詢' }).click({ noWaitAfter: true });

    // 為了進入此點 才可以正常透過程式買票
    await page.goto('https://irs.thsrc.com.tw/IMINT/?wicket:interface=:0::');

    // 出發站
    await page.locator('select[name=selectStartStation]').selectOption(SETTING.StartStation);

    // 抵達站
    await page.locator('select[name=selectDestinationStation]').selectOption(SETTING.DestinationStation);

    // 出發日期
    const dateInput = await page.locator('input[name=toTimeInputField]');
    await dateInput.evaluate((x) => x.type = 'text');
    await dateInput.fill(SETTING.Date, { force: true });

    // 出發時間
    await page.locator('select[name=toTimeTable]').selectOption(SETTING.Time);

    // 全票張數
    await page.locator('select[name="ticketPanel\\:rows\\:0\\:ticketAmount"]').selectOption(SETTING.TicketCount);

    // 等待處理驗證碼成功並查詢
    await waitSolveCaptchaAndSearch(page);

    // 確認
    await page.getByRole('button', { name: '確認車次' }).click();

    // 輸入身分證字號1
    await page.getByPlaceholder('取票時請依輸入之證件號碼出示證件').fill(SETTING.IdentityCode);

    // 輸入身分證字號2
    await page.getByPlaceholder('乘車請攜帶所輸入之證件備查').fill(SETTING.IdentityCode);

    // 同意相關條款
    await page.getByLabel('我已明確了解').click();

    // 完成
    await page.getByRole('button', { name: '完成訂位' }).click();

    // 再次確認(真的要訂位再開這行)
    // await page.getByRole('button', { name: '確定' }).click();
}

async function waitSolveCaptchaAndSearch(page) {
    // 抓取驗證碼圖片
    await page.locator('#BookingS1Form_homeCaptcha_passCode').screenshot({ path: CAPTCHA_PATH });

    // 處理驗證碼
    const text = await Captcha.solve(CAPTCHA_PATH);

    // 填入驗證碼
    await page.locator('#securityCode').fill(text);

    // 查詢
    await page.getByRole('button', { name: '開始查詢' }).click();

    try {
        // 等待確認錯誤訊息是否出現
        await page.getByText('error').waitFor({ state: 'visible', timeout: 1000 });

        // 全票張數要重選
        await page.locator('select[name="ticketPanel\\:rows\\:0\\:ticketAmount"]').selectOption(SETTING.TicketCount);

        // 出現錯誤訊息 重跑流程
        await waitSolveCaptchaAndSearch(page);
    } catch (error) {
        // 無錯誤訊息
        return;
    }
}