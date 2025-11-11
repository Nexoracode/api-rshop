#!/bin/sh

echo "🚀 Starting application..."

# Check if we need to run migrations
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "📦 Running database migrations..."
    npm run mig:run
    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed successfully"
    else
        echo "❌ Migration failed"
        exit 1
    fi
fi

# Start the application
echo "🎯 Starting NestJS application..."
exec node dist/src/main.js
