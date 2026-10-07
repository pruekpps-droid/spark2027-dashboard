# SPARK 2027 Executive Dashboard

```
spark2027-dashboard/
├── index.html            หน้า Dashboard (โครง HTML เท่านั้น)
├── assets/app.js         Logic ทุกหน้า + โหลด data/data.json
├── assets/style.css      สไตล์ทั้งหมด
├── data/data.json        ข้อมูล task (สร้างโดย convert.py — ห้ามแก้มือ)
├── data/config.json      mapping Bucket → Workstream, ตัวเลือกซ่อนชื่อ
├── scripts/convert.py    Planner .xlsx → data.json
├── scripts/publish.bat   convert + git commit + push
├── scripts/serve.bat     เปิดทดสอบในเครื่อง http://localhost:8000
└── input/                วาง Planner_Latest.xlsx (ไม่ขึ้น Git)
```

## ติดตั้งครั้งแรก
1. `pip install pandas openpyxl`
2. `git init` → เชื่อม remote (private repo)

## อัปเดตข้อมูล
1. Export Planner → บันทึกเป็น `input/Planner_Latest.xlsx` (หรือให้ PAD ทำ)
2. ดับเบิลคลิก `scripts/publish.bat`

## ทดสอบในเครื่อง
ดับเบิลคลิก `scripts/serve.bat` (ห้ามเปิด index.html ตรง ๆ เพราะ fetch จะถูกบล็อก)

## หมายเหตุ
- data.json ใหม่ (วันที่ export หรือจำนวน task เปลี่ยน) จะล้าง cache การแก้ไขใน browser อัตโนมัติ
- ช่องที่กรอกเอง (cur, next, delay, recovery, exec, manual ฯลฯ) ใน data.json จะถูกเก็บไว้ตาม Task ID ตอน convert รอบถัดไป
- ตั้ง `"maskOwners": true` ใน config.json ถ้าไม่ต้องการแสดงชื่อเต็ม
