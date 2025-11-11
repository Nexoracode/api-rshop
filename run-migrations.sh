#!/bin/sh
# اسکریپت اجرای Migration در کانتینر

echo "🔄 در حال اجرای Migration ها..."

# اجرای migration
npm run mig:run

if [ $? -eq 0 ]; then
    echo "✅ Migration ها با موفقیت اجرا شدند"
    exit 0
else
    echo "❌ خطا در اجرای Migration ها"
    exit 1
fi
