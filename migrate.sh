#!/bin/sh
# اسکریپت اجرای مستقیم Migration از فایل compiled

echo "🔄 در حال اجرای Migration ها..."

# اجرای مستقیم typeorm CLI
npx typeorm migration:run -d dist/db/data-source.js

if [ $? -eq 0 ]; then
    echo "✅ Migration ها با موفقیت اجرا شدند"
    exit 0
else
    echo "❌ خطا در اجرای Migration ها"
    exit 1
fi
