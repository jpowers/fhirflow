export const extractDependencies = (resource) => {
    let dependencies = [];
  
    // Recursively find all `reference` fields inside any FHIR resource, but only include references that do NOT contain 'http'
    const findReferences = (obj) => {
      if (typeof obj === "object" && obj !== null) {
        for (let key in obj) {
          if (key === "reference" && typeof obj[key] === "string") {
            // Only add references that do NOT contain 'http'
            if (!obj[key].includes("http")) {
              dependencies.push(obj[key]);
            }
          } else {
            findReferences(obj[key]);
          }
        }
      }
    };
  
    findReferences(resource);
    return dependencies;
  };