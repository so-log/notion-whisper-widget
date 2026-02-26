/**
 * 앱 아이콘 생성 스크립트
 * 말풍선 아이콘을 PNG + ICO 형식으로 생성
 */
import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

const SIZE = 512
const S = SIZE / 256 // scale factor

// RGBA 버퍼 생성
const pixels = Buffer.alloc(SIZE * SIZE * 4, 0)

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
  const i = (y * SIZE + x) * 4
  // Alpha blending
  const srcA = a / 255
  const dstA = pixels[i + 3] / 255
  const outA = srcA + dstA * (1 - srcA)
  if (outA > 0) {
    pixels[i] = Math.round((r * srcA + pixels[i] * dstA * (1 - srcA)) / outA)
    pixels[i + 1] = Math.round((g * srcA + pixels[i + 1] * dstA * (1 - srcA)) / outA)
    pixels[i + 2] = Math.round((b * srcA + pixels[i + 2] * dstA * (1 - srcA)) / outA)
    pixels[i + 3] = Math.round(outA * 255)
  }
}

function fillCircle(cx, cy, r, red, green, blue, alpha = 255) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist <= r) {
        // Anti-aliasing at edges
        const edgeAlpha = Math.min(1, r - dist) * (alpha / 255)
        setPixel(x, y, red, green, blue, Math.round(edgeAlpha * 255))
      }
    }
  }
}

function fillRoundRect(x1, y1, x2, y2, radius, r, g, b, a = 255) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      let inside = true
      let dist = 0

      // Check corners
      if (x < x1 + radius && y < y1 + radius) {
        dist = Math.sqrt((x - (x1 + radius)) ** 2 + (y - (y1 + radius)) ** 2)
        inside = dist <= radius
      } else if (x > x2 - radius && y < y1 + radius) {
        dist = Math.sqrt((x - (x2 - radius)) ** 2 + (y - (y1 + radius)) ** 2)
        inside = dist <= radius
      } else if (x < x1 + radius && y > y2 - radius) {
        dist = Math.sqrt((x - (x1 + radius)) ** 2 + (y - (y2 - radius)) ** 2)
        inside = dist <= radius
      } else if (x > x2 - radius && y > y2 - radius) {
        dist = Math.sqrt((x - (x2 - radius)) ** 2 + (y - (y2 - radius)) ** 2)
        inside = dist <= radius
      }

      if (inside) {
        setPixel(x, y, r, g, b, a)
      }
    }
  }
}

// === 아이콘 그리기 ===

// 배경: 둥근 사각형 (진한 회색)
fillRoundRect(8*S, 8*S, 247*S, 247*S, 48*S, 51, 51, 51)

// 말풍선 본체 (흰색 둥근 사각형)
fillRoundRect(32*S, 48*S, 224*S, 168*S, 28*S, 255, 255, 255)

// 말풍선 꼬리 (왼쪽 하단 삼각형)
for (let row = 0; row < 32*S; row++) {
  const width = 32*S - row
  for (let col = 0; col < width; col++) {
    setPixel(48*S + col, 168*S + row, 255, 255, 255)
  }
}

// 점 3개 (타이핑 인디케이터 - 회색)
fillCircle(90*S, 108*S, 14*S, 120, 120, 120)
fillCircle(128*S, 108*S, 14*S, 150, 150, 150)
fillCircle(166*S, 108*S, 14*S, 180, 180, 180)

// === PNG 생성 ===
function createPNG(width, height, rgbaBuffer) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 6  // color type (RGBA)
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  const ihdr = makeChunk('IHDR', ihdrData)

  // IDAT chunk - raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0 // filter: None
    rgbaBuffer.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const compressed = deflateSync(rawData)
  const idat = makeChunk('IDAT', compressed)

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const typeBuffer = Buffer.from(type, 'ascii')
  const crcData = Buffer.concat([typeBuffer, data])

  let crc = 0xFFFFFFFF
  for (let i = 0; i < crcData.length; i++) {
    crc ^= crcData[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
    }
  }
  crc ^= 0xFFFFFFFF
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc >>> 0)

  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

// === ICO 생성 (PNG 내장) ===
function createICO(pngBuffer) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)     // reserved
  header.writeUInt16LE(1, 2)     // type: ICO
  header.writeUInt16LE(1, 4)     // image count

  // Directory entry: 16 bytes
  const entry = Buffer.alloc(16)
  entry[0] = 0                   // width (0 = 256)
  entry[1] = 0                   // height (0 = 256)
  entry[2] = 0                   // color palette
  entry[3] = 0                   // reserved
  entry.writeUInt16LE(1, 4)      // color planes
  entry.writeUInt16LE(32, 6)     // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8)  // size of PNG data
  entry.writeUInt32LE(22, 12)    // offset to PNG data (6 + 16 = 22)

  return Buffer.concat([header, entry, pngBuffer])
}

// 파일 저장
const pngBuffer = createPNG(SIZE, SIZE, pixels)
writeFileSync('resources/icon.png', pngBuffer)
console.log('Created resources/icon.png')

const icoBuffer = createICO(pngBuffer)
writeFileSync('resources/icon.ico', icoBuffer)
console.log('Created resources/icon.ico')

console.log('Done!')
