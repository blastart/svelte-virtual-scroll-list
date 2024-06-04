// move all .tgz files from the current directory to the 'releases' directory
import fs from 'fs'
import path from 'path'

const tgzFiles = fs.readdirSync(process.cwd()).filter(file => file.endsWith('.tgz'))
const releasesDir = path.join(process.cwd(), 'releases')
if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir)
}
tgzFiles.forEach(file => {
    fs.renameSync(path.join(process.cwd(), file), path.join(releasesDir, file))
})
// Path: movePackTgz.js
