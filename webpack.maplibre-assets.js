// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: CC0-1.0

const fs = require("fs");
const path = require("path");

class MapLibreAssetsPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("MapLibreAssetsPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "MapLibreAssetsPlugin",
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          const mapLibreDist = path.dirname(require.resolve("maplibre-gl/dist/maplibre-gl.js"));

          for (const fileName of ["maplibre-gl.js", "maplibre-gl.css"]) {
            const filePath = path.join(mapLibreDist, fileName);
            const source = fs.readFileSync(filePath);
            compilation.emitAsset(fileName, new compiler.webpack.sources.RawSource(source));
          }
        }
      );
    });
  }
}

module.exports = MapLibreAssetsPlugin;
