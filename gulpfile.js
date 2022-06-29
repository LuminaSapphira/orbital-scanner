const gulp = require("gulp");
const { src, dest, watch } = require("gulp");
const del = require("del");
const zip = require("gulp-zip")
const tstl = require("typescript-to-lua");
const fs = require("fs");

function cleanBuild()  {
    return del("build/**/*");
}

function resources() {
    return src(['res/**/*', 'LICENSE.txt']).pipe(dest('build/'));
}

function transpile(cb)  {
    let result = tstl.transpileProject("tsconfig.json", {"outDir": "build"});
    cb();
}

function mwatch() {
    watch("src/**/*.ts", transpile);
    watch("res/**/*", resources);
}

function getName(info) {
    return info.name + "_" + info.version;
}

function rename() {
    let info = JSON.parse(fs.readFileSync("build/info.json"));
    return src("build/**/*").pipe(dest(`buildtmp/${getName(info)}`));
}
function pack() {   
    let info = JSON.parse(fs.readFileSync("build/info.json"));
    return src('buildtmp/**/*').pipe(zip(`${getName(info)}.zip`, {buffer: false})).pipe(dest('dist'));
}

function cleanTmp() {
    let info = JSON.parse(fs.readFileSync("build/info.json"));
    return del(`./buildtmp`);
}

const build = gulp.series(cleanBuild, gulp.parallel(transpile, resources));
const clean = gulp.parallel(cleanBuild, cleanTmp)
exports.default = build;
exports.clean = cleanBuild;
exports.resources = resources;
exports.transpile = transpile;
exports.watch = mwatch;
exports.package = gulp.series(build, rename, pack, cleanTmp);
