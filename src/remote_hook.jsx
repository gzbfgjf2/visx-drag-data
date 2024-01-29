import useSWRImmutable from "swr/immutable";
import data from "../data.json";

async function readJsonFile() {
  try {
    return data;
  } catch (err) {
    console.error("Error reading file", err);
    throw err;
  }
}

const fetcher = async () => {
  let data = await readJsonFile();
  console.log(data);
  return data;
};

export function useData() {
  return useSWRImmutable("data", fetcher);
}
