/**
 * Fix VRMA animation to allow AutoLookAt to work
 * Removes X/Z translation and neutralizes head/neck rotations
 */

const fs = require('fs');
const path = require('path');

function parseGLB(buffer) {
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);

  if (magic !== 0x46546C67) {
    throw new Error('Not a valid GLB file');
  }

  const jsonChunkLength = buffer.readUInt32LE(12);
  const jsonChunkType = buffer.readUInt32LE(16);
  const jsonStart = 20;
  const jsonBuffer = buffer.slice(jsonStart, jsonStart + jsonChunkLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

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

  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJsonBuffer = Buffer.concat([
    jsonBuffer,
    Buffer.alloc(jsonPadding, 0x20)
  ]);

  const headerSize = 12;
  const jsonChunkHeaderSize = 8;
  const binChunkHeaderSize = binBuffer ? 8 : 0;
  const totalLength = headerSize + jsonChunkHeaderSize + paddedJsonBuffer.length +
                      (binBuffer ? binChunkHeaderSize + binBuffer.length : 0);

  const glbBuffer = Buffer.alloc(totalLength);
  let offset = 0;

  glbBuffer.writeUInt32LE(0x46546C67, offset);
  offset += 4;
  glbBuffer.writeUInt32LE(2, offset);
  offset += 4;
  glbBuffer.writeUInt32LE(totalLength, offset);
  offset += 4;

  glbBuffer.writeUInt32LE(paddedJsonBuffer.length, offset);
  offset += 4;
  glbBuffer.writeUInt32LE(0x4E4F534A, offset);
  offset += 4;

  paddedJsonBuffer.copy(glbBuffer, offset);
  offset += paddedJsonBuffer.length;

  if (binBuffer) {
    glbBuffer.writeUInt32LE(binBuffer.length, offset);
    offset += 4;
    glbBuffer.writeUInt32LE(0x004E4942, offset);
    offset += 4;
    binBuffer.copy(glbBuffer, offset);
  }

  return glbBuffer;
}

function fixVRMA(inputPath, outputPath) {
  console.log('Reading VRMA file...');
  const buffer = fs.readFileSync(inputPath);

  const { json, binBuffer } = parseGLB(buffer);

  // Build node name map
  const nodeNames = json.nodes ? json.nodes.map(node => node.name || 'unnamed') : [];
  console.log('\nAvailable nodes:');
  nodeNames.forEach((name, index) => {
    console.log(`  ${index}: ${name}`);
  });

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
      const nodeName = nodeNames[target.node] || `node_${target.node}`;

      // Remove X/Z translation from all nodes
      if (target.path === 'translation') {
        console.log(`  Found translation channel for ${nodeName}`);

        const outputAccessor = json.accessors[sampler.output];
        const bufferView = json.bufferViews[outputAccessor.bufferView];

        if (outputAccessor.type === 'VEC3') {
          const byteOffset = (bufferView.byteOffset || 0) + (outputAccessor.byteOffset || 0);
          const count = outputAccessor.count;

          console.log(`    Removing X/Z values (keeping Y), count: ${count}`);

          for (let i = 0; i < count; i++) {
            const offset = byteOffset + i * 12;
            binBuffer.writeFloatLE(0.0, offset);
            binBuffer.writeFloatLE(0.0, offset + 8);
          }

          modified = true;
        }
      }

      // Neutralize head and neck rotations
      if (target.path === 'rotation') {
        const lowerNodeName = nodeName.toLowerCase();

        if (lowerNodeName.includes('head') || lowerNodeName.includes('neck')) {
          console.log(`  Found rotation channel for ${nodeName} - NEUTRALIZING`);

          const outputAccessor = json.accessors[sampler.output];
          const bufferView = json.bufferViews[outputAccessor.bufferView];

          if (outputAccessor.type === 'VEC4') {
            const byteOffset = (bufferView.byteOffset || 0) + (outputAccessor.byteOffset || 0);
            const count = outputAccessor.count;

            console.log(`    Setting to neutral rotation (0,0,0,1), count: ${count}`);

            // Set all quaternions to identity (0, 0, 0, 1)
            for (let i = 0; i < count; i++) {
              const offset = byteOffset + i * 16; // 4 floats * 4 bytes
              binBuffer.writeFloatLE(0.0, offset);      // x = 0
              binBuffer.writeFloatLE(0.0, offset + 4);  // y = 0
              binBuffer.writeFloatLE(0.0, offset + 8);  // z = 0
              binBuffer.writeFloatLE(1.0, offset + 12); // w = 1
            }

            modified = true;
          }
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
    console.log('\nNo data found to modify');
  }
}

// Main execution
const inputFile = path.join(__dirname, '../public/idle_loop_original.vrma');
const outputFile = path.join(__dirname, '../public/idle_loop.vrma');

try {
  fixVRMA(inputFile, outputFile);
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
