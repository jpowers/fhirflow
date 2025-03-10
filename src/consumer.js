import { Kafka } from "kafkajs";
import fetch from "node-fetch";
import { extractDependencies } from "./extractDependencies.js";

const kafka = new Kafka({ clientId: "fhir-consumer", brokers: ["localhost:9092"] });
const processedConsumer = kafka.consumer({ groupId: "fhir-processed-group" });
const pendingConsumer = kafka.consumer({ groupId: "fhir-pending-group" });
const producer = kafka.producer();
const FHIR_SERVER = "http://localhost:8080/fhir";

let processedResources = new Set();

const postFhirServer = async (resource) => {
  try {
    let data = JSON.parse(resource);
    const url = `${FHIR_SERVER}/${data.resourceType}/${data.id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/fhir+json" },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log(`✅ Successfully posted: ${data.resourceType}/${data.id}`);
      processedResources.add(`${data.resourceType}/${data.id}`);
    } else {
      console.error(`❌ Failed to post: ${data.resourceType}/${data.id}`);
      console.error(`${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error posting to HAPI FHIR:", error);
  }
};

const run = async () => {
  await processedConsumer.connect();
  await pendingConsumer.connect();
  await producer.connect();

  await processedConsumer.subscribe({ topic: "fhir-processed", fromBeginning: true });
  await pendingConsumer.subscribe({ topic: "fhir-pending", fromBeginning: true });

  console.log("📡 Listening for processed resources...");

  await processedConsumer.run({
    eachMessage: async ({ message }) => {
      let data = JSON.parse(message.value.toString());
      console.log(`📥 Received message: ${data.resourceType}/${data.id}`);
      await postFhirServer(message.value.toString());
    }
  });

  console.log("⏳ Processing pending resources...");

  await pendingConsumer.run({
    eachMessage: async ({ message }) => {
      let data = JSON.parse(message.value.toString());
      let dependencies = extractDependencies(data);
      let allDependenciesMet = dependencies.every(dep => processedResources.has(dep));

      if (allDependenciesMet) {
        await producer.send({ topic: "fhir-processed", messages: [{ value: JSON.stringify(data) }] });
        console.log(`✅ Processed dependent resource: ${data.resourceType}/${data.id}`);
      } else {
        console.log(`⏳ Still waiting for dependencies: ${dependencies}`);
      }
    }
  });
};

run().catch(console.error);
