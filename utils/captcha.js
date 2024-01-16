import { Image } from 'image-js';
import { PythonShell } from 'python-shell';
import pkg from 'lodash';
const { isEqual } = pkg;

class Point {
    x = 0
    y = 0

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const COLOR_WHITE = [255, 255, 255, 255];
const COLOR_BLACK = [0, 0, 0, 255];

function isWhiteOrNull(color) {
    return !color || isEqual(color, COLOR_WHITE);
}

function isBlackOrNull(color) {
    return !color || isEqual(color, COLOR_BLACK);
}

/** 二值化 */ 
function binarize(img) {
    for (let x = 0; x < img.width; x++) {
        for (let y = 0; y < img.height; y++) {
            const pixelColor = img.getPixelXY(x, y);

            const invertedColor = pixelColor.map(value => value > 127 ? 255 : 0)
            img.setPixelXY(x, y, invertedColor);
        }
    }

    return img;
}

// 該條誤導線固定為橫向向右上增幅
// 判斷目前的Y位置是否屬於線的正常範圍 正常來說下一行的首Y會跟上一行相同或是加減1
function belongsToLine(currentY, lastY) {
    return currentY === lastY || currentY === (lastY - 1) || currentY === (lastY + 1);
}

/** 消除斑點 */ 
function removeSpot(img) {
    for (let x = 0; x < img.width; x++) {
        for (let y = 0; y < img.height; y++) {
            const pixelColor = img.getPixelXY(x, y);
            const pixelColor1 = x === 0 ? null : img.getPixelXY(x - 1, y);
            const pixelColor2 = x === img.width - 1 ? null : img.getPixelXY(x + 1, y);
            const pixelColor3 = y === 0 ? null : img.getPixelXY(x, y - 1);
            const pixelColor4 = y === img.height - 1 ? null : img.getPixelXY(x, y + 1);

            // 將周圍都是白點的黑點轉為白點
            if (isBlackOrNull(pixelColor)
                && ((isWhiteOrNull(pixelColor1) && isWhiteOrNull(pixelColor2) && isWhiteOrNull(pixelColor3))
                    || (isWhiteOrNull(pixelColor1) && isWhiteOrNull(pixelColor3) && isWhiteOrNull(pixelColor4))
                    || (isWhiteOrNull(pixelColor2) && isWhiteOrNull(pixelColor3) && isWhiteOrNull(pixelColor4)))) {
                img.setPixelXY(x, y, COLOR_WHITE);
            }

            // 將周圍都是黑點的白點轉為黑點
            if (isWhiteOrNull(pixelColor)
                && ((isBlackOrNull(pixelColor1) && isBlackOrNull(pixelColor2) && isBlackOrNull(pixelColor3))
                    || (isBlackOrNull(pixelColor1) && isBlackOrNull(pixelColor3) && isBlackOrNull(pixelColor4))
                    || (isBlackOrNull(pixelColor2) && isBlackOrNull(pixelColor3) && isBlackOrNull(pixelColor4)))) {
                img.setPixelXY(x, y, COLOR_BLACK);
            }
        }
    }

    return img;
}

function removeLeftLine(img) {
    let lastColumnStartY = 0;
    let lastColumnEndY = 0;
    let startNotBelongs = false;
    let endNotBelongs = false;

    for (let x = 0; x < img.width; x++) {
        for (let y = 0; y < img.height; y++) {
            const pixelColor = img.getPixelXY(x, y);

            if (isBlackOrNull(pixelColor)) {
                if (x > 0 && !belongsToLine(y, lastColumnStartY)) {
                    startNotBelongs = true;
                }

                lastColumnStartY = y;
                break;
            }
        }

        for (let y = img.height - 1; y >= 0; y--) {
            const pixelColor = img.getPixelXY(x, y);
            if (isBlackOrNull(pixelColor)) {
                if (x > 0 && !belongsToLine(y, lastColumnEndY)) {
                    endNotBelongs = true;
                }

                lastColumnEndY = y;
                break;
            }
        }

        if (startNotBelongs || endNotBelongs) {
            // 進到這代表遇到驗證碼的起始點
            for (let m = 0; m < x; m++) {
                for (let n = 0; n < img.height; n++) {
                    img.setPixelXY(m, n, COLOR_WHITE);
                }
            }

            return img;
        }
    }
}

function removeRightLine(img) {
    let lastColumnStartY = 0;
    let lastColumnEndY = 0;
    let startNotBelongs = false;
    let endNotBelongs = false;

    for (let x = img.width - 1; x >= 0; x--) {
        for (let y = 0; y < img.height; y++) {
            const pixelColor = img.getPixelXY(x, y);

            if (isBlackOrNull(pixelColor)) {
                if (x < (img.width - 1) && !belongsToLine(y, lastColumnStartY)) {
                    startNotBelongs = true;
                }

                lastColumnStartY = y;
                break;
            }
        }

        for (let y = img.height - 1; y >= 0; y--) {
            const pixelColor = img.getPixelXY(x, y);
            if (isBlackOrNull(pixelColor)) {
                if (x < (img.width - 1) && !belongsToLine(y, lastColumnEndY)) {
                    endNotBelongs = true;
                }

                lastColumnEndY = y;
                break;
            }
        }

        if (startNotBelongs || endNotBelongs) {
            // 進到這代表遇到驗證碼的起始點
            for (let m = img.width - 1; m > x; m--) {
                for (let n = 0; n < img.height; n++) {
                    img.setPixelXY(m, n, COLOR_WHITE);
                }
            }

            return img;
        }
    }

    return img;
}

export async function solve(path) {
    let text = '';

    await Image.load(path).then(async img => {
        // 預先處理圖片
        // img = binarize(img);
        // img = removeSpot(img);
        // img = removeLeftLine(img);
        // img = removeRightLine(img);
        // img = img.grey();
        // img = img.open().morphologicalGradient().invert().erode();
        
        // 執行辨識
        const result = await PythonShell.run('python/text_identifier.py');
        text = result[0] ?? '';
    });

    return text;
}