import { writeFile } from "fs/promises";

const formula = (x) => (1 / 8) * x ** 2 - 0.05 * x + 0.02;

const data = [...Array(11).keys()].map((i) =>
  [...Array(11).keys()].map((x) => formula(x * 0.1) + i * 0.01),
);
function saveDataAsJson(data, filename = "data.json") {
  const jsonString = JSON.stringify(data, null, 2); // Convert data to JSON string
  writeFile(filename, jsonString, (err) => {
    if (err) {
      console.error("Error writing file", err);
    } else {
      console.log("Successfully wrote to", filename);
    }
  });
}

saveDataAsJson(data);
