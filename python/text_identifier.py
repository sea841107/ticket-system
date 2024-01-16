import ddddocr

# 開啟驗證碼圖片
with open('image/captcha.png', 'rb') as f:
    image_bytes = f.read()

# 辨識驗證碼
ocr = ddddocr.DdddOcr(show_ad=False)
text = ocr.classification(image_bytes)
print(text)
