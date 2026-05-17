const gulp = require('gulp');
const prefix = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const sass = require('gulp-sass')(require('sass'));

/* ----------------------------------------- */
/*  Compile Sass
/* ----------------------------------------- */

// Small error handler helper function.
function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}

const SCSS_ROOT = path.join(__dirname, 'scss');
const SYSTEM_SCSS = ["scss/**/*.scss"];
const SYSTEM_SCSS_ENTRIES = ["scss/**/*.scss", "!scss/**/_*.scss"];

function compileScss() {
  // Configure options for sass output. For example, 'expanded' or 'nested'
  let options = {
    outputStyle: 'expanded',
    includePaths: [SCSS_ROOT],
    importer: function(url) {
      if (url.startsWith('/')) {
        return { file: path.join(SCSS_ROOT, url.slice(1)) };
      }

      return null;
    }
  };
  return gulp.src(SYSTEM_SCSS_ENTRIES)
    .pipe(sourcemaps.init())
    .pipe(
      sass(options)
        .on('error', handleError)
    )
    .pipe(prefix({
      cascade: false
    }))
    .pipe(gulp.dest("./css"))
}
const css = gulp.series(compileScss);

/* ----------------------------------------- */
/*  Watch Updates
/* ----------------------------------------- */

function watchUpdates() {
  gulp.watch(SYSTEM_SCSS, css);
}

/* ----------------------------------------- */
/*  Export Tasks
/* ----------------------------------------- */

exports.default = gulp.series(
  compileScss,
  watchUpdates
);
exports.css = css;
