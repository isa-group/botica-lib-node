import fs from "fs";
import YAML from "yaml";

/**
 * A mapping for any configuration.
 */
interface Configuration {}

type LoadFunction = <T extends Configuration>(path: string) => Promise<T>;

const LOAD_FUNCTIONS: { [extension: string]: LoadFunction } = {
  json: loadJsonFile,
  yml: loadYamlFile,
  yaml: loadYamlFile,
};

/**
 * Loads the configuration file at the given path.
 *
 * @param path the path of the file to load
 * @template T the configuration schema to load
 */
function loadConfigurationFile<T extends Configuration>(
  path: string,
): Promise<T> {
  const extension = path.substring(path.lastIndexOf(".") + 1);
  const loadFunction = LOAD_FUNCTIONS[extension];
  if (!loadFunction)
    throw new Error("Unsupported configuration file extension");
  return loadFunction(path);
}

async function loadJsonFile<T extends Configuration>(path: string): Promise<T> {
  return await JSON.parse(await readFile(path));
}

async function loadYamlFile<T extends Configuration>(path: string): Promise<T> {
  return await YAML.parse(await readFile(path));
}

async function readFile(path: string): Promise<string> {
  return fs.readFileSync(path, { encoding: "utf8" });
}

export { Configuration, loadConfigurationFile };
