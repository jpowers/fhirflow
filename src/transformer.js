import { Kafka } from "kafkajs";
import { transformResource } from "./transformResource.js";
import { extractDependencies } from "./extractDependencies.js";

const kafka = new Kafka({ clientId: "fhir-transformer", brokers: ["localhost:9092"] });
const consumer = kafka.consumer({ groupId: "fhir-transform-group" });
const producer = kafka.producer();

const processMessage = async (message) => {
  let data;
  try {
    data = JSON.parse(message);
  } catch (error) {
    console.error("Invalid JSON:", message);
    return;
  }

  // Apply transformation to any FHIR resource
  data = transformResource(data);

  let dependencies = extractDependencies(data);

  if (dependencies.length === 0) {
    await producer.send({ topic: "fhir-processed", messages: [{ value: JSON.stringify(data) }] });
    console.log(`✅ Processed independent resource: ${data.resourceType}/${data.id}`);
  } else {
    await producer.send({ topic: "fhir-pending", messages: [{ value: JSON.stringify(data) }] });
    console.log(`⏳ Queued pending resource: ${data.resourceType}/${data.id}, waiting for ${dependencies}`);
  }
};

const run = async () => {
  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: "fhir-raw-data", fromBeginning: true });

  console.log("📡 Listening for FHIR messages...");

  await consumer.run({
    eachMessage: async ({ message }) => {
      await processMessage(message.value.toString());
    }
  });
};

run().catch(console.error);
