const fs = require('fs');
fs.cpSync("assets", "dist/assets", {recursive: true});