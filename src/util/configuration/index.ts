import fs from "fs";
import YAML from "yaml";

/**
 * A mapping for any configuration.
 */
export interface Configuration {}

/**
 * Loads the configuration file at the given path.
 *
 * @param path the path of the file to load
 * @template T the configuration schema to load
 */
export async function loadConfigurationFile<T extends Configuration>(
  path: string,
): Promise<T> {
  if (!fs.existsSync(path) || !fs.lstatSync(path).isFile()) {
    throw new Error("File not found");
  }

  return loadYamlFile<T>(path)
    .catch(() => loadJsonFile<T>(path))
    .catch(() =>
      Promise.reject(new Error("Unsupported configuration file extension")),
    );
}

async function loadYamlFile<T extends Configuration>(path: string): Promise<T> {
  return await YAML.parse(await readFile(path));
}

async function loadJsonFile<T extends Configuration>(path: string): Promise<T> {
  return await JSON.parse(await readFile(path));
}

async function readFile(path: string): Promise<string> {
  return fs.readFileSync(path, { encoding: "utf8" });
}
