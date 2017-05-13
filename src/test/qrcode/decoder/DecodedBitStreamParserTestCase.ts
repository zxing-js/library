/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*package com.google.zxing.qrcode.decoder;*/

import 'mocha'
import * as assert from 'assert'
import DecodedBitStreamParser from './../../../lib/qrcode/decoder/DecodedBitStreamParser'
import BitSourceBuilder from './../../common/BitSourceBuilder'
import Version from './../../../lib/qrcode/decoder/Version'

/**
 * Tests {@link DecodedBitStreamParser}.
 *
 * @author Sean Owen
 */
describe("DecodedBitStreamParserTestCase", () => {

  it("testSimpleByteMode", () => {/*throws Exception*/
    const builder = new BitSourceBuilder()
    builder.write(0x04, 4) // Byte mode
    builder.write(0x03, 8) // 3 bytes
    builder.write(0xF1, 8)
    builder.write(0xF2, 8)
    builder.write(0xF3, 8)
    const result: string = DecodedBitStreamParser.decode(builder.toByteArray(),
        Version.getVersionForNumber(1), null, null).getText()
    assert.strictEqual(result, "\u00f1\u00f2\u00f3")
  })

  it("testSimpleSJIS", () => {/*throws Exception*/
    const builder = new BitSourceBuilder()
    builder.write(0x04, 4); // Byte mode
    builder.write(0x04, 8); // 4 bytes
    builder.write(0xA1, 8)
    builder.write(0xA2, 8)
    builder.write(0xA3, 8)
    builder.write(0xD0, 8)
    const result: string = DecodedBitStreamParser.decode(builder.toByteArray(),
        Version.getVersionForNumber(1), null, null).getText()
    assert.strictEqual(result, "\uff61\uff62\uff63\uff90")
  })

  // TYPESCRIPTPORT: CP437 not supported by TextEncoding. TODO: search for an alternative
  // See here for a possibility: https://github.com/SheetJS/js-codepage
  // it("testECI", () => {/*throws Exception*/
  //   const builder = new BitSourceBuilder()
  //   builder.write(0x07, 4); // ECI mode
  //   builder.write(0x02, 8); // ECI 2 = CP437 encoding
  //   builder.write(0x04, 4); // Byte mode
  //   builder.write(0x03, 8); // 3 bytes
  //   builder.write(0xA1, 8)
  //   builder.write(0xA2, 8)
  //   builder.write(0xA3, 8)
  //   const byteArray = builder.toByteArray()
  //   const result: string = DecodedBitStreamParser.decode(byteArray,
  //       Version.getVersionForNumber(1), null, null).getText()
  //   assert.strictEqual(result, "\u00ed\u00f3\u00fa")
  // })

  it("testECI", () => {/*throws Exception*/
    const builder = new BitSourceBuilder()
    builder.write(0x07, 4); // ECI mode
    builder.write(0x03, 8); // ECI 3 = ISO8859_1
    builder.write(0x04, 4); // Byte mode
    builder.write(0x03, 8); // 3 bytes
    builder.write(0xE0, 8)
    builder.write(0xE1, 8)
    builder.write(0xE2, 8)
    const byteArray = builder.toByteArray()
    const result: string = DecodedBitStreamParser.decode(byteArray,
        Version.getVersionForNumber(1), null, null).getText()
    assert.strictEqual(result, "\u00E0\u00E1\u00E2")
  })

  it("testHanzi", () => {/*throws Exception*/
    const builder = new BitSourceBuilder()
    builder.write(0x0D, 4); // Hanzi mode
    builder.write(0x01, 4); // Subset 1 = GB2312 encoding
    builder.write(0x01, 8); // 1 characters
    builder.write(0x03C1, 13)
    const result: string = DecodedBitStreamParser.decode(builder.toByteArray(),
        Version.getVersionForNumber(1), null, null).getText()
    assert.strictEqual(result, "\u963f")
  })

  // TODO definitely need more tests here

})
