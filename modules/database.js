/*
import { join } from "node:path";
import { Low, JSONFile } from "lowdb";
import { log } from "./log.js";
import { name, directory, defaultData } from "./constants.js";

const database = new Low(new JSONFile(join(directory, "data", `${name}.json`)));
await database.read();
if (!database.data) database.data = { ...defaultData };
await database.write();

log.info("Started database");

export { database };
*/
throw new Error("database is currently unused");
