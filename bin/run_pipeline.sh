#!/bin/bash

# Start Kafka-based FHIR Pipeline processes in the background

echo "🚀 Starting FHIR Kafka Processing Pipeline..."

# Start Transformer
nohup node src/transformer.js > logs/transformer.log 2>&1 &
echo $! > logs/transformer.pid

echo "✅ Transformer started. Logs: logs/transformer.log"

# Start Consumer
nohup node src/consumer.js > logs/consumer.log 2>&1 &
echo $! > logs/consumer.pid

echo "✅ Consumer started. Logs: logs/consumer.log"

echo "📡 Pipeline is now running in the background. Use ./stop_pipeline.sh to stop it."
