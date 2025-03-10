export const transformResource = (resource) => {
  switch (resource.resourceType) {
    case "Patient":
      resource.name = [{ use: "official", family: "Transformed", given: ["Transformed"] }];
      console.log(`🔹 Transformed Patient Name: ${JSON.stringify(resource.name)}`);
      break;

    case "Observation":
      if (resource.valueQuantity) {
        resource.valueQuantity.value = 999; // Example transformation
        console.log(`🔹 Transformed Observation Value: ${resource.valueQuantity.value}`);
      }
      break;

    case "MedicationRequest":
      if (resource.dosageInstruction) {
        resource.dosageInstruction.forEach((d) => {
          d.text = "Updated Dosage";
        });
        console.log(`🔹 Transformed MedicationRequest Dosage: ${JSON.stringify(resource.dosageInstruction)}`);
      }
      break;

    default:
      console.log(`ℹ️ No transformation applied for: ${resource.resourceType}`);
      break;
  }

  return resource;
};
