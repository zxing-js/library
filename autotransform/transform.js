const fs = require('fs')
const path = require('path')

function walkDirectory(dirPath) {
    const results = []
    const dir = path.resolve(__dirname, dirPath)
    console.log("Applying in dir =", dir)
    const list = fs.readdirSync(dir)
    list.forEach(function(file) {
        file = path.join(dir, file)
        const stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(walk(file))
        else results.push(file)
    })
    return results
}

function replaceInOneFile(file, regexp, replacement) {
    const data = fs.readFileSync(file, 'utf8')
    const result = data.replace(regexp, replacement)

    if (result !== data) {
        fs.writeFileSync(file, result, 'utf8')
        console.log("Transform " + regexp + " applied for file ", file, "OK")
    }
}

function replaceAllInDirectory(dirPath) {
    const files = walkDirectory(dirPath)

    for(const file of files) {
        for (const ra of replacements) {
            replaceInOneFile(file, ra[0], ra[1])
        }
    }
}

const replacements = [
    [/^(package com\.google\.zxing\..+?;)$/gm, "/*$1*/"],
    [/public final class /g, "export default class "],
    [/import org.junit.Assert;/g, "import 'mocha'\r\nimport * as assert from 'assert'"],
    [/import org.junit.Test;\r\n/g, ""],
    [/for \(int ([a-zA-Z0-9_]+) =/g, "for (let $1: number/*int*/ ="],
    [/  @Test\r\n(\s+)public void ([a-zA-Z0-9_]+)\(\)\s+{/g, "$1it(\"$2\", () => {"],
    [/export default class ([a-zA-Z0-9_]+) extends Assert {/g, "describe(\"$1\", () => {"],
    [/^    ((?:(?!const|let)[a-zA-Z0-9+])+) ([a-zA-Z0-9+]+) = new /gm, "    const $2: $1 = new "],
    [/  private static ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+\(.+?\)) {/g, "  private static $2: $1 {"],
    [/  public static ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+\(.+?\)) {/g, "  public static $2: $1 {"],
    [/\): String/g, "): string"],
    [/assertEquals\(/g, "assert.strictEqual("],
    [/^    assertNull(\(.+)$/gm, "    assert.strictEqual(null === $1, true)"],
    [/^    assertArrayEquals(\(.+)$/gm, "    assert.strictEqual(AssertUtils.int32ArraysAreEqual($1), true)"],
    [/^    assertTrue(\(.+)$/gm, "    assert.strictEqual($1, true)"],
    [/^    assertFalse(\(.+)$/gm, "    assert.strictEqual($1, false)"],
    [/^((?:(?!for|while|do).)+?);$/gm, "$1"],
    [/ == /g, " === "],
    [/ != /g, " !== "]
]

replaceAllInDirectory('../src/test/common/')