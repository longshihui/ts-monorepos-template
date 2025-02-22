import vue from "rollup-plugin-vue";
import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";
import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript2 from "rollup-plugin-typescript2";
import { DEFAULT_EXTENSIONS } from "@babel/core";

const INPUT_PATH = path.resolve(process.env.WORKSPACE, "src/index.ts");
const OUTPUT_PATH = path.resolve(process.env.WORKSPACE, "dist");

export default new Promise(async (resolve) => {
  const pkg = await getPackageJSON(process.env.WORKSPACE);
  const { buildOptions } = pkg;
  const externals = [];

  if (pkg.dependencies) {
    externals.push(...Object.keys(pkg.dependencies));
  }

  if (pkg.peerDependencies) {
    externals.push(...Object.keys(pkg.peerDependencies));
  }

  resolve({
    input: INPUT_PATH,
    output: [
      {
        file: path.join(OUTPUT_PATH, "bundle.umd.js"),
        format: "umd",
        name: buildOptions.name,
      },
      {
        file: path.join(OUTPUT_PATH, "bundle.esm.js"),
        format: "es",
      },
    ],
    plugins: [
      vue({
        normalizer: "~vue-runtime-helpers/dist/normalize-component.js",
        css: false,
      }),
      postcss({
        extensions: [".css", ".less", ".scss", ".sass"],
        extract: "bundle.css",
      }),
      typescript2({
        check: true,
        tsconfig: path.join(__dirname, "./tsconfig.json"),
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
          },
        },
      }),
      babel({
        babelHelpers: "bundled",
        exclude: ["node_modules/**"],
        extensions: [...DEFAULT_EXTENSIONS, ".tsx", ".ts", ".vue"],
      }),
      nodeResolve(),
      commonjs(),
      terser(),
    ],
    external: [...externals, "vue"],
  });
});

async function getPackageJSON(packagePath) {
  const configFilePath = path.join(packagePath, "package.json");

  if (fs.existsSync(configFilePath)) {
    // 查找当前包的workspace的package.json
    const pkg = await fsp.readFile(configFilePath, "utf-8");
    // 读取构建配置
    return JSON.parse(pkg);
  }
  return null;
}
