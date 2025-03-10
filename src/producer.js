import { Kafka } from "kafkajs";
import fs from "fs";

const kafka = new Kafka({ clientId: "fhir-producer", brokers: ["localhost:9092"] });
const producer = kafka.producer();
const topic = "fhir-raw-data";
const dataDir = "./test_bulk_data";

const sendMessages = async () => {
  await producer.connect();
  console.log("Kafka Producer connected...");

  const files = fs.readdirSync(dataDir);
  for (const file of files) {
    if (file.endsWith(".ndjson")) {
      console.log(`Processing ${file}...`);
      const content = fs.readFileSync(`${dataDir}/${file}`, "utf8");
      const messages = content.split("\n").filter(line => line).map(value => ({ value }));

      await producer.send({ topic, messages });
      console.log(`Sent ${messages.length} messages from ${file}`);
    }
  }

  await producer.disconnect();
};

sendMessages().catch(console.error);

