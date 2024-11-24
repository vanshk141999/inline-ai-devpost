import gulp from 'gulp'
import zip from 'gulp-zip'
import clean from 'gulp-clean'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const manifest = require('../build/manifest.json')

// delete the old zip file
gulp.src('package/*').pipe(clean())

gulp
  .src('build/**')
  .pipe(zip(`${manifest.name.replaceAll(' ', '-')}-${manifest.version}.zip`))
  .pipe(gulp.dest('package'))
