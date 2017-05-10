Autotransform
=============

Used to apply regular expression based transformations for automatic Java to TypeScript port.


How to use
==========

Copy java files to input folder.

Then run:

`npm run autotransform`

The transformed files are in output folder. Check them and then copy to their destination folder.


Adding replacements
===================
Modify transform.js const array `replacements` and add aditional regexp transformations. Take care to match only what 
is needed, is very easy to match more and break things.

