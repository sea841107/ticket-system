import { test, expect } from '@playwright/test'

let isFirst = true;

const SETTING = {
    Target: 'YOUR_TARGET', // PG ONE
    Account: 'YOUR_ACCOUNT', // testaccount
    Password: 'YOUR_PASSWORD', // testpassword
    TicketCount: 'YOUR_TICKET_COUNT', // 1
}

test.describe('kktix', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://kktix.com/');
    });

    test('buy', async ({ page }) => {
        await start(page, SETTING.Target);
    });
})

async function start(page, target) {
    try {
        // 到首頁
        await page.getByRole('heading', { name: 'KKTIX', exact: true }).click();

        // 切成中文
        await page.getByRole('link', { name: '繁體中文' }).click();

        // 點選目標場
        await page.getByRole('heading', { name: target }).click();

        // 下一步
        await page.locator('a').filter({ hasText: /^下一步$/ }).click();

        // 如果是第一次 需先登入
        if (isFirst) {
            // 點選登入
            await page.getByLabel('立刻成為 KKTIX 會員').getByRole('link', { name: '登入' }).click();

            // 輸入帳號
            await page.getByPlaceholder('使用者名稱或 email').fill(SETTING.Account);

            // 輸入密碼
            await page.getByPlaceholder('密碼').fill(SETTING.Password);

            // 登入
            await page.getByRole('button', { name: '登入' }).click();

            isFirst = false;
        }

        // 選擇張數
        for (let i = 0; i < SETTING.TicketCount; i++) {
            await page.getByRole('button', { name: '' }).first().click();
        }

        // 同意相關條款
        await page.getByLabel('我已經閱讀並同意').click();

        // 取得題目
        const question = await page.getByText('？').first().textContent();

        // 取得答案
        const answer = getAnswer(question);
        if (answer === '') {
            // 未正確取得答案 將進入錯誤處理
            throw new Error();
        }

        // 填入答案
        await page.getByPlaceholder('請填入答案').fill(getAnswer(question));

        // 下一步
        await page.getByRole('button', { name: '下一步' }).click();

        try {
            // 確認是否跳出答案錯誤提示
            await expect(page.getByPlaceholder('答案錯誤，再試一次！')).toBeVisible();

            // 若有跳出 重新開始
            await start(page, target);
        } catch (e) {
            // 沒出現答案錯誤的訊息 會進到這

            // 確認買票(真的要買再開這行)
            // await page.getByText('確認表單資料').click();
        }

    } catch (e) {
        // 遇到錯誤就重新開始
        await start(page, target);
    }
}

/** 從題庫取得答案 */
function getAnswer(question) {
    if (question.includes('第五年巔峰賽一點不意外')) {
        return '愛奇藝找不到PG的替代';
    }

    if (question.includes('中文說唱')) {
        return '唯楚最棒';
    }

    if (question.includes('我想要賺錢搬到市中心')) {
        return '你那種破歌我一天能寫四公斤';
    }

    if (question.includes('經歷了適量的掃蕩')) {
        return '造就了王唯楚質量的保障';
    }

    if (question.includes('17年登頂')) {
        return '5年的壓迫，也沒能順利的KICK ME OUT';
    }

    if (question.includes('第一屆比賽奪冠決賽歌名')) {
        return '破釜沉舟';
    }

    if (question.includes('但為人說話滿算數')) {
        return '索隆';
    }

    if (question.includes('第一張個人專輯名稱')) {
        return '《PHASELESS》无相之相';
    }

    if (question.includes('再也不去追求什麼完美的下一句歌詞')) {
        return 'YEAH OH NAH NAH NAH';
    }

    if (question.includes('哪一隻MV的開頭從紅色電話亭走出來')) {
        return 'NO CAP';
    }

    if (question.includes('ANSW1R的第12首歌')) {
        return '午時已到';
    }

    if (question.includes('PGONE的星座是什麼')) {
        return '牡羊座';
    }

    if (question.includes('PGONE的H.M.E裡面沒有罵到誰')) {
        return 'VAVA';
    }

    if (question.includes('PGONE《ANSW1R》台北站的日期有哪幾天')) {
        return '6/28 6/29';
    }

    if (question.includes('PG One 的都是你"All Of You"是 feat誰')) {
        return 'H3R3';
    }

    if (question.includes('左上角金額是多少')) {
        return '《中國有嘻哈》雙冠軍除了PGONE還有誰';
    }

    if (question.includes('PG One在《中國有嘻哈》是誰的戰對')) {
        return '吳亦凡';
    }

    if (question.includes('WAIT A MINUTE是PG One跟誰唱的')) {
        return 'YAMY';
    }

    if (question.includes('Talk Too Much這首歌MV裡面燒的東西是什麼')) {
        return '鍵盤';
    }

    return '';
}