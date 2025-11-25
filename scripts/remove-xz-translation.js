/**
 * Remove X/Z translation from VRMA animation file
 * This script removes horizontal movement while keeping Y-axis (vertical) movement
 */

const fs = require('fs');
const path = require('path');

function parseGLB(buffer) {
  // Read GLB header
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);

  if (magic !== 0x46546C67) { // 'glTF'
    throw new Error('Not a valid GLB file');
  }

  // Read JSON chunk
  const jsonChunkLength = buffer.readUInt32LE(12);
  const jsonChunkType = buffer.readUInt32LE(16);
  const jsonStart = 20;
  const jsonBuffer = buffer.slice(jsonStart, jsonStart + jsonChunkLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  // Read BIN chunk (if exists)
  let binBuffer = null;
  if (jsonStart + jsonChunkLength < buffer.length) {
    const binChunkLength = buffer.readUInt32LE(jsonStart + jsonChunkLength);
    const binStart = jsonStart + jsonChunkLength + 8;
    binBuffer = buffer.slice(binStart, binStart + binChunkLength);
  }

  return { json, binBuffer };
}

function createGLB(json, binBuffer) {
  const jsonString = JSON.stringify(json);
  const jsonBuffer = Buffer.from(jsonString);

  // Pad JSON to 4-byte alignment
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJsonBuffer = Buffer.concat([
    jsonBuffer,
    Buffer.alloc(jsonPadding, 0x20) // Space padding
  ]);

  // Calculate total length
  const headerSize = 12;
  const jsonChunkHeaderSize = 8;
  const binChunkHeaderSize = binBuffer ? 8 : 0;
  const totalLength = headerSize + jsonChunkHeaderSize + paddedJsonBuffer.length +
                      (binBuffer ? binChunkHeaderSize + binBuffer.length : 0);

  // Create GLB buffer
  const glbBuffer = Buffer.alloc(totalLength);
  let offset = 0;

  // Write GLB header
  glbBuffer.writeUInt32LE(0x46546C67, offset); // magic: 'glTF'
  offset += 4;
  glbBuffer.writeUInt32LE(2, offset); // version
  offset += 4;
  glbBuffer.writeUInt32LE(totalLength, offset); // length
  offset += 4;

  // Write JSON chunk header
  glbBuffer.writeUInt32LE(paddedJsonBuffer.length, offset); // chunk length
  offset += 4;
  glbBuffer.writeUInt32LE(0x4E4F534A, offset); // chunk type: 'JSON'
  offset += 4;

  // Write JSON chunk data
  paddedJsonBuffer.copy(glbBuffer, offset);
  offset += paddedJsonBuffer.length;

  // Write BIN chunk if exists
  if (binBuffer) {
    glbBuffer.writeUInt32LE(binBuffer.length, offset); // chunk length
    offset += 4;
    glbBuffer.writeUInt32LE(0x004E4942, offset); // chunk type: 'BIN'
    offset += 4;
    binBuffer.copy(glbBuffer, offset);
  }

  return glbBuffer;
}

function removeXZTranslation(inputPath, outputPath) {
  console.log('Reading VRMA file...');
  const buffer = fs.readFileSync(inputPath);

  const { json, binBuffer } = parseGLB(buffer);

  console.log('Searching for translation animations...');

  // Find animations
  if (!json.animations || json.animations.length === 0) {
    console.log('No animations found in file');
    return;
  }

  let modified = false;

  json.animations.forEach((animation, animIndex) => {
    console.log(`\nProcessing animation ${animIndex}: ${animation.name || 'unnamed'}`);

    animation.channels.forEach((channel, channelIndex) => {
      const sampler = animation.samplers[channel.sampler];
      const target = channel.target;

      // Look for translation (position) channels
      if (target.path === 'translation') {
        console.log(`  Found translation channel ${channelIndex} for node ${target.node}`);

        // Get accessor for output values
        const outputAccessor = json.accessors[sampler.output];
        const bufferView = json.bufferViews[outputAccessor.bufferView];

        // Check if this is VEC3 (x, y, z)
        if (outputAccessor.type === 'VEC3') {
          const byteOffset = (bufferView.byteOffset || 0) + (outputAccessor.byteOffset || 0);
          const count = outputAccessor.count;

          console.log(`    Removing X/Z values (keeping Y), count: ${count}`);

          // Modify the binary data - set X and Z to 0, keep Y
          for (let i = 0; i < count; i++) {
            const offset = byteOffset + i * 12; // 3 floats * 4 bytes
            binBuffer.writeFloatLE(0.0, offset);      // X = 0
            // Skip Y at offset + 4
            binBuffer.writeFloatLE(0.0, offset + 8);  // Z = 0
          }

          modified = true;
        }
      }
    });
  });

  if (modified) {
    console.log('\nWriting modified VRMA file...');
    const outputBuffer = createGLB(json, binBuffer);
    fs.writeFileSync(outputPath, outputBuffer);
    console.log(`Success! Saved to: ${outputPath}`);
  } else {
    console.log('\nNo translation data found to modify');
  }
}

// Main execution
const inputFile = path.join(__dirname, '../public/idle_loop.vrma');
const outputFile = path.join(__dirname, '../public/idle_loop_fixed.vrma');

try {
  removeXZTranslation(inputFile, outputFile);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
