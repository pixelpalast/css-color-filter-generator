import {compute} from "./test.mjs";
import {colors} from "./tokens.huk24.mjs";
import fs from "fs";

let results = [];
console.time("time label");

const promises = Object.entries(colors.color.palette.primary).map(
  async ([key, value]) => {
    console.log(key);
    return await compute(value.value, 1);
  }
);

results = await Promise.all(promises);

let json = JSON.stringify(results);
console.log(json);
fs.writeFile(
  "data.json",
  JSON.stringify(results),
  (err) => err && console.error(err)
);

console.timeEnd("time label");
