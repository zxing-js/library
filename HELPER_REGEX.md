# Helper Regular Expressions

Run in the order, with caution

## Arrays

Search: `int\[\]`
Replace: `Int32Array`

## Props

Search: `((private|public|static)( static)?) final ([\w\[\]]+) (\w+)( =|;)`
Replace: `$1 /*final*/ $5: $4$6`

## forof

Search: `for\s*\((.*) (\w+) :`
Replace: `for (const $2/*: $1*/ of`

## for

Search: `for\s*\((\w+) (\w+)`
Replace: `for (let $2 /*$1*/`

## Number Casts

Search: `\((float|int|byte|short|long|char)\)\s*(\w+)`
Replace: `<$1>$2`

## Function types

Search: `((private|public|static)( static)?) ([\w\[\]]+) (\w+\(.*?\))`
Replace: `$1 $5: $4`

### No declared accessors

⚠️ Be careful. ⚠️

Search: `([\w\[\]]+) (\w+\(.*?\))`
Replace: `$2: $1`

## Variable declarations

Search: `^(\s*)([\w\[\]]+) (\w+) =`
Replace: `$1let $3: $2 =`

⚠️ Be careful️. ⚠️

Search: `^(\s*)([\w\[\]]+) (\w+);`
Replace: `$1let $3: $2;`

## Params (single)

Search: `\((([\w\[\]]+) (\w+)(\,)?)+\)`
Replace: `($3: $2$4)`

## Params (multiple)

⚠️ Be careful️. ⚠️

Search: `(\w+) (\w+)(, |\))`
Replace: `$2: $1$3`

## Numeric types

Search: `: (byte|short|int|float|long)(\[\])?`
Replace: `: /*$1$2*/ number$2`

## numeric arrays

Search: `new int\[(\w+)\]`
Replace: `new Int32Array($1)`
Replace: `new Array($1)`

## Equals comparision

Search: `(!=|==)`
Replace: `$1=`
