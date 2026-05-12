# pordee Setup Guide

วิธีเอา pordee ไปใช้กับ Antigravity IDE ใน project อื่น หรือใช้เป็นคำสั่ง global

## 1. ใช้ใน project นี้

เปิด `D:\pordee-ide` ใน Antigravity แล้วใช้ workflow ได้เลย:

```text
/pordee
/pordee lite
/pordee full
/pordee stop
/pordee-stats
```

หรือรันผ่าน terminal:

```powershell
node bin\pordee.js on
node bin\pordee.js status
node bin\pordee.js stats
```

## 2. ติดตั้งเป็น global CLI

จากโฟลเดอร์ `D:\pordee-ide`:

```powershell
npm link
```

หลังจากนั้นเรียกจากที่ไหนก็ได้:

```powershell
pordee on
pordee level lite
pordee level full
pordee off
pordee status
pordee stats
```

ยกเลิก global link:

```powershell
npm unlink -g pordee
```

อีกวิธี ถ้าไม่อยากใช้ link:

```powershell
npm install -g D:\pordee-ide
```

## 3. ใช้กับ project อื่นใน Antigravity

สมมติ project เป้าหมายอยู่ที่:

```powershell
D:\my-project
```

คัดลอก workflow เข้า project นั้น:

```powershell
Copy-Item -Recurse -Force D:\pordee-ide\.agent D:\my-project\.agent
```

ถ้า project นั้นยังไม่มี `GEMINI.md` และ `AGENTS.md`:

```powershell
Copy-Item -Force D:\pordee-ide\GEMINI.md D:\my-project\GEMINI.md
Copy-Item -Force D:\pordee-ide\AGENTS.md D:\my-project\AGENTS.md
```

แล้วเปิด `D:\my-project` ใน Antigravity ใหม่ หรือ reload workspace เพื่อให้ Antigravity scan `.agent/workflows/`

## 4. ใช้ global CLI กับ project อื่น

ถ้าติดตั้ง `pordee` แบบ global แล้ว workflow ใน project อื่นควรเรียก:

```powershell
pordee on
pordee reminder
pordee stats
```

ถ้าไม่ได้ติดตั้ง global ให้ workflow เรียก path ตรงแทน:

```powershell
node D:\pordee-ide\bin\pordee.js on
node D:\pordee-ide\bin\pordee.js reminder
node D:\pordee-ide\bin\pordee.js stats
```

## 5. State และ logs

pordee state เก็บที่:

```text
~\.pordee\state.json
```

Antigravity stats อ่านจาก:

```text
~\.gemini\antigravity\.token-monitor\
~\.gemini\antigravity\brain\*\.system_generated\logs\overview.txt
```

ถ้าอ่านจาก `overview.txt` จะแสดง `Output tokens (approx)` เพราะเป็นค่าประมาณจากข้อความ response ไม่ใช่ token usage จริง

## 6. ตรวจสอบ setup

```powershell
pordee status
pordee on
pordee reminder
pordee stats
```

ถ้าใช้แบบไม่ global:

```powershell
node D:\pordee-ide\bin\pordee.js status
node D:\pordee-ide\bin\pordee.js on
node D:\pordee-ide\bin\pordee.js reminder
node D:\pordee-ide\bin\pordee.js stats
```

## 7. หมายเหตุ

- `npm link` เหมาะกับเครื่อง dev เพราะแก้โค้ดใน `D:\pordee-ide` แล้วคำสั่ง global เห็นผลทันที
- `npm install -g D:\pordee-ide` เหมาะกับการติดตั้งนิ่งกว่า แต่ถ้าแก้ source ต้อง install ใหม่
- Antigravity slash command เช่น `/pordee` มาจาก `.agent/workflows/pordee.md`
- ถ้า `/pordee` ไม่ขึ้น ให้ reload workspace หรือปิดเปิด Antigravity ใหม่
