const fs = require("fs").promises;
const { storeAlFatahData } = require("../controllers/alFatahController");
const { storeJalalSonsData } = require("../controllers/jalalSonsController");
const { storeRahimStoreData } = require("../controllers/rahimStoreController");
const { storeMetroData } = require("../controllers/metroController");
const { storeRajaSahibData } = require("../controllers/rajaSahibController");

function parseCSVLine(line) {
  const fields = [];
  let currentField = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      fields.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }

  fields.push(currentField);
  return fields;
}

async function extractData(fileName, storeName = "") {
  try {
    const data = await fs.readFile(fileName, "utf8");
    const lines = data.split("\n").filter((line) => line.trim() !== "");
    const items = lines.map((line) => parseCSVLine(line.trim()));

    if (storeName === "alFatah") {
      await storeAlFatahData(items);
    } else if (storeName === "jalalSons") {
      await storeJalalSonsData(items);
    } else if (storeName === "rahimStore") {
      await storeRahimStoreData(items);
    } else if (storeName === "metro") {
      await storeMetroData(items);
    } else if (storeName === "rajaSahib") {
      await storeRajaSahibData(items);
    }
  } catch (err) {
    console.error(err);
  }
}

module.exports = extractData;
