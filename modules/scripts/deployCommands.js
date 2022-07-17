import { database } from "../database.js";
import { deploy } from "../commands.js";

if (!database.data.deployedCommands) {
    const result = await deploy();
    database.data.deployedCommands = result;
    await database.write();
}
