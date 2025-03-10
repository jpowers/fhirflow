# FHIR Kafka-Based Processing Pipeline

This project implements a **Kafka-based FHIR processing pipeline** using **Node.js**.  
It **ingests, transforms, and processes FHIR bulk data** while ensuring **dependencies are resolved** using Kafka-only logic.

## **🚀 Pipeline Overview**
| **Step** | **Description** | **Kafka Topic** |
|----------|----------------|-----------------|
| **Producer** | Reads FHIR NDJSON files and sends them to Kafka | `fhir-raw-data` |
| **Transformer** | Modifies FHIR resources (e.g., `Patient`, `Observation`, etc.), detects dependencies | `fhir-processed`, `fhir-pending` |
| **Consumer** | Waits for dependencies, processes pending data, posts to HAPI FHIR | `fhir-processed` |

---

## **📂 Project Structure**
```plaintext
fhirflow/
├── Dockerfile # Docker setup for the pipeline
├── README.md
├── bin
│   ├── run_pipeline.sh
│   └── stop_pipeline.sh
├── docker-compose.yml # Manages Kafka, Zookeeper, HAPI FHIR, and the pipeline
├── logs
├── package.json
├── src
│   ├── consumer.js           # Waits for dependencies & posts data to HAPI FHIR
│   ├── extractDependencies.js
│   ├── producer.js           # Reads NDJSON files and sends them to Kafka
│   ├── transformResource.js  # Generic transformation function for any FHIR resource
│   └── transformer.js        # Transforms FHIR data & resolves dependencies

```

---

## **📌 Transformation Rules**
The **`transformResource.js`** module applies transformations dynamically based on **FHIR resource type**:

| **FHIR Resource** | **Transformation Applied** |
|------------------|--------------------------|
| `Patient` | Updates `name` to `[{ "use": "official", "family": "Transformed", "given": ["Transformed"] }]` |
| `Observation` | Updates `valueQuantity.value` to `999` |
| `MedicationRequest` | Updates `dosageInstruction.text` to `"Updated Dosage"` |
| **Other Resource Types** | Logged as "No transformation applied" |

---

## **🚀 Running the Pipeline**

### Start Kafka and HAPI
```sh
docker-compose up
```

### Install node modules
```sh
npm install
```

### Run Producer to send Bulk data to Kafka
```sh
npm run producer
```
### Start the Pipeline (Without Docker)**
```sh
./bin/run_pipeline.sh
```

### Check Logs**
```sh
tail -f logs/transformer.log
tail -f logs/consumer.log
```

---

## **🔹 Extending the Transformer**
To **add more transformations**, update `transformResource.js`:

```javascript
export const transformResource = (resource) => {
  switch (resource.resourceType) {
    case "Patient":
      resource.name = [{ use: "official", family: "Transformed", given: ["Transformed"] }];
      break;

    case "Observation":
      if (resource.valueQuantity) {
        resource.valueQuantity.value = 999;
      }
      break;

    case "MedicationRequest":
      if (resource.dosageInstruction) {
        resource.dosageInstruction.forEach((d) => {
          d.text = "Updated Dosage";
        });
      }
      break;

    default:
      console.log(`ℹ️ No transformation applied for: ${resource.resourceType}`);
  }

  return resource;
};
```

---

## **📡 Managing Kafka Topics**
### **List Topics**
```sh
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

### **Clear Kafka Topics**
```sh
docker-compose down -v
```

---

## **❓ Troubleshooting**
### **Kafka Error: "No leader for topic-partition"**
Run:
```sh
docker-compose restart kafka zookeeper
```

### **Check Running Processes**
```sh
ps aux | grep node
```

### **Stop All Scripts**
```sh
pkill -f "node transformer.js"
pkill -f "node consumer.js"
```

---

## **🚀 Next Steps**
1️⃣ **Test the updated pipeline with FHIR NDJSON files**  
2️⃣ **Ensure transformed data is published correctly**  
3️⃣ **Extend `transformResource.js` for additional FHIR resource types**  
