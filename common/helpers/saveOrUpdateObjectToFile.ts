import * as fs from 'fs';
import * as path from 'path';
import { reviver } from './reviver.ts';
import replacer from './replacer.ts';

export function saveOrUpdateObjectFileSync(obj, fileName) {
  let fileContent;
  const filePath = path.resolve(process.cwd(), fileName);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Read the current file content and parse it
    const data = fs.readFileSync(filePath, 'utf8');
    fileContent = JSON.parse(data, reviver);
    fileContent.push(obj);
  } else {
    // If file does not exist, start with a new array containing the object
    fileContent = [obj];
  }

  // Write the updated content back to the file
  fs.writeFileSync(filePath, JSON.stringify(fileContent, replacer, 2));
}
