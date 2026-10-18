import { EventEmitter } from 'node:events';
import path from 'node:path';
import { createBuilder } from '@content-collections/core';

const events = new EventEmitter();
const errors = [];

for (const event of [
  'collector:read-error',
  'collector:parse-error',
  'transformer:validation-error',
  'transformer:result-error',
  'transformer:error',
]) {
  events.on(event, ({ error, filePath, file, document, collection }) => {
    const source = filePath ?? path.join(collection.directory, file?.path ?? document?._meta?.filePath ?? '');
    errors.push(`${source}: ${error.message}`);
  });
}

try {
  const builder = await createBuilder('content-collections.ts', undefined, events);
  await builder.build();
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

if (errors.length > 0) {
  console.error(`Article validation failed:\n${errors.join('\n\n')}`);
  process.exitCode = 1;
} else {
  console.log('Article validation passed.');
}
