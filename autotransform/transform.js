const fs = require('fs')
const path = require('path')

function walkDirectory(dirPath) {
    const results = []
    const dir = path.resolve(__dirname, dirPath)
    const list = fs.readdirSync(dir)
    list.forEach(function(file) {
        file = path.join(dir, file)
        const stat = fs.statSync(file)
        if (stat && stat.isDirectory()) results = results.concat(walkDirectory(file))
        else results.push(file)
    })

    if (results.length === 0) {
        console.log("No files in folder " + dir)
    }

    return results
}

function replaceContentInOneFile(filePath, replacements, outputDirName) {
    console.log("File " + filePath + ":")
    const originalContent = fs.readFileSync(filePath, 'utf8')
    let result = originalContent
    let modified = false
    for (const ra of replacements) {
        const regexp = ra[0]
        const replacement = ra[1]
        const modifiedResult = result.replace(regexp, replacement)
        if (result !== modifiedResult) {
            console.log("\tapplied " + regexp + " ok")
            result = modifiedResult
            modified = true
        }
    }
    if (modified === true) {
        const ext = path.extname(filePath)
        const fileName = path.basename(filePath, ext)
        const outputFile = path.join(__dirname, outputDirName, fileName + ".ts")
        fs.writeFileSync(outputFile, result, 'utf8')
        console.log("\tfile " + outputFile + " written to output ok")
    } else {
        console.log("\tfile " + filePath + " not modified")
    }
}

function replaceAllInDirectory(inputDirName, outputDirName) {
    const allFilesInInput = walkDirectory(inputDirName)

    for(const filePath of allFilesInInput) {
        replaceContentInOneFile(filePath, replacements, outputDirName)
    }
}

const replacements = [
    [/^(package com\.google\.zxing.*?;)$/gm, "/*$1*/"],
    [/import org.junit.Assert;/g, "import 'mocha'\r\nimport * as assert from 'assert'"],
    [/import org.junit.Test;\r\n/g, ""],
    [/^(import java.+)$/gm, "/*$1*/"],
    [/^import com\.google\.zxing\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+);?$/gm, "import './$1/$2/$3'"],
    [/^import com\.google\.zxing\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+);?$/gm, "import './$1/$2'"],
    [/^import com\.google\.zxing\.([a-zA-Z0-9_]+);?$/gm, "import './$1'"],

    [/public final class /g, "export default class "],
    [/public abstract class ([a-zA-Z0-9_]+)/g, "/*export default $1*/abstract class $1"],
    [/  @Test\r\n(\s+)public void ([a-zA-Z0-9_]+)\(\)\s+{/g, "$1it(\"$2\", () => {"],
    [/export default class ([a-zA-Z0-9_]+) extends Assert {/g, "describe(\"$1\", () => {"],

    [/^  (public|protected|private)( static)?( final)? ([a-zA-Z0-9_<>]+) ([a-zA-Z0-9_]+\(.*?\))/gm, "  $1$2 $5: $4"],

    [/((?!(?:[a-zA-Z0-9_])).)int ([a-zA-Z0-9_]+)/g, "$1$2: number/*int*/"],
    [/((?!(?:[a-zA-Z0-9_])).)float ([a-zA-Z0-9_]+)/g, "$1$2: number/*float*/"],
    [/((?!(?:[a-zA-Z0-9_])).)double ([a-zA-Z0-9_]+)/g, "$1$2: number/*double*/"],
    [/((?!(?:[a-zA-Z0-9_])).)int\[\] ([a-zA-Z0-9_]+)/g, "$1$2: Int32Array"],
    [/((?!(?:[a-zA-Z0-9_])).)byte\[\] ([a-zA-Z0-9_]+)/g, "$1$2: Int8Array"],
    [/((?!(?:[a-zA-Z0-9_])).)List<([a-zA-Z0-9_]+)> ([a-zA-Z0-9_]+)/g, "$1$3: Array<$2>"],
    [/((?!(?:[a-zA-Z0-9_])).)Collection<([a-zA-Z0-9_]+)> ([a-zA-Z0-9_]+)/g, "$1$3: Array<$2>"],
    [/((?!(?:[a-zA-Z0-9_])).)String ([a-zA-Z0-9_]+)/g, "$1$2: string"],
    [/((?!(?:[a-zA-Z0-9_])).)boolean ([a-zA-Z0-9_]+)/g, "$1$2: boolean"],

    [/^(\s+)([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+) = /gm, "$1const $3: $2 = "],

    [/^(\s+)([a-zA-Z0-9_]+): ([a-zA-Z0-9_<>/\\\*]+)/gm, "$1const $2: $3"],


    [/new int\[([a-zA-Z0-9_]+)\]/g, "new Int32Array()/*Int32Array($1)*/"],
    [/new byte\[([a-zA-Z0-9_]+)\]/g, "new Int8Array()/*Int8Array($1)*/"],
    [/new byte\[\] { /g, "Int8Array.from(["],
    [/new int\[\] {/g, "Int32Array.from(["],
    [/\(byte\) /g, "/*(byte)*/ "],
    [/\(int\) /g, "/*(int)*/ "],

    [/for \(([a-zA-Z0-9_]+): ([a-zA-Z0-9_<>]+)/g, "for (let $1: $2"],
    [/(throws [[a-zA-Z0-9_]+Exception )/g, "/*$1*/"],

    [/for \(int ([a-zA-Z0-9_]+) =/g, "for (let $1: number/*int*/ ="],
    [/^    ((?:(?!const|let)[a-zA-Z0-9+])+) ([a-zA-Z0-9+]+) = new /gm, "    const $2: $1 = new "],
    [/^  private static final ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+) =/gm, "  private static $2: $1 ="],
    [/^  public static final ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+) =/gm, "  public static $2: $1 ="],
    [/^  private static ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+\(.+?\)) {/gm, "  private static $2: $1 {"],
    [/^  public static ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+\(.+?\)) {/gm, "  public static $2: $1 {"],
    [/^  private final ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+)/gm, "  private $2: $1"],
    [/^  public final ([a-zA-Z0-9_]+) ([a-zA-Z0-9_]+)/gm, "  public $2: $1"],
    [/^  private final /gm, "  private "],
    [/^  public final /gm, "  public "],

    [/assertFalse\((".+?"), (.+)\)/g, "assert.strictEqual($1, false, $2)"],
    [/assertFalse\((.+?)\)/g, "assert.strictEqual($1, false)"],
    [/assertTrue\((".+?"), (.+)\)/g, "assert.strictEqual($1, true, $2)"],
    [/assertTrue\((.+?)\)/g, "assert.strictEqual($1, true)"],

    [/assertEquals\((.+?), (.+)\)/g, "assert.strictEqual($2, $1)"],

    [/: ([a-zA-Z0-9_]+) = new \1/g, " = new $1"],

    [/^((?:(?!for|while|do).)+?);$/gm, "$1"],

    [/([0-9]+\.[0-9]+)f/g, "$1"],

    [/ == /g, " === "],
    [/ != /g, " !== "]
]

replaceAllInDirectory('input', 'output')