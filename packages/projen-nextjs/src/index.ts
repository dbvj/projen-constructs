import { Component, TextFile } from "projen";
import {
    TypeScriptJsxMode,
    TypeScriptModuleResolution,
    TypescriptConfigOptions,
} from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";

export const NEXTJS_TSCONFIG_OPTIONS: TypescriptConfigOptions = {
    fileName: "tsconfig.json",
    include: ["next-env.d.ts", ".next/types/**/*.ts"],
    compilerOptions: {
        // required by Next.js - https://github.com/vercel/next.js/blob/canary/packages/create-next-app/templates/app/ts/tsconfig.json
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: TypeScriptModuleResolution.BUNDLER,
        isolatedModules: true,
        resolveJsonModule: true,
        jsx: TypeScriptJsxMode.PRESERVE,

        // recommended by Next.js
        allowJs: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        lib: ["dom", "dom.iterable", "esnext"],
        strict: true,
        target: "es5",
        // @ts-expect-error - projen type bug
        incremental: true,
        plugins: [
            {
                name: "next",
            },
        ],
        types: ["jest", "node", "@testing-library/jest-dom"],

        declaration: false, // Storybook has trouble with PNPM and declaration files
    },
};

export interface NextjsEslintOptions {}

export class NextjsEslint extends Component {
    constructor(
        project: TypeScriptProject,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options: NextjsEslintOptions = {},
    ) {
        super(project);

        if (project.eslint) {
            const nextDep = project.deps.tryGetDependency("next");
            const nextVersionSuffix = nextDep?.version
                ? `@${nextDep?.version}`
                : "";
            project.addDevDeps(`@next/eslint-plugin-next${nextVersionSuffix}`);
            project.eslint.addExtends("plugin:@next/next/recommended");

            const conflictingRules = ["jsx-a11y/anchor-is-valid"];

            for (const rule of conflictingRules) {
                if (project.eslint.rules?.[rule]) {
                    project.eslint.addRules({ [rule]: "off" });
                }
            }
        }
    }
}

export interface NextjsJestConfigFileOptions {
    /**
     * The relative directory where next.config.js is located in relation to the jest config file.
     *
     * @default "./"
     */
    dir?: string;

    /**
     * The filename of the jest config file being created as a shim for next/jest.
     *
     * @default "jest.config.cjs"
     */
    filename?: string;
}

/**
 * Must be used in conjunction with a jest config json file (not inside package.json).
 */
export class NextjsJestConfigFile extends Component {
    declare readonly project: TypeScriptProject;

    public readonly file: TextFile | undefined;

    constructor(
        project: TypeScriptProject,
        options: NextjsJestConfigFileOptions = {},
    ) {
        super(project);

        if (project.jest?.file?.path) {
            this.file = new TextFile(
                project,
                options.filename ?? "jest.config.cjs",
                {
                    lines: [
                        'const fs = require("fs");',
                        'const nextJest = require("next/jest");',
                        "",
                        "// eslint-disable-next-line import/no-default-export",
                        `module.exports = async () => {
    const standardConfig = JSON.parse(fs.readFileSync("${project.jest?.file?.path}", "utf-8"));

    const buildNextJestConfig = nextJest({ dir: "${options.dir ?? "./"}" });
    const nextJestConfig = await buildNextJestConfig(standardConfig)();

    return {
        ...nextJestConfig,
        transformIgnorePatterns: standardConfig.transformIgnorePatterns, // nextJest adds /node_modules for no reason
    };
};`,
                    ],
                },
            );
        }
    }
}

export class NextjsTasks extends Component {
    declare readonly project: TypeScriptProject;

    constructor(project: TypeScriptProject) {
        super(project);

        const cleanCompileTask =
            project.tasks.tryFind("clean-compile") ??
            project.addTask("clean-compile", {
                description: "Clean up the compiled output",
            });
        cleanCompileTask.exec(
            "rm -rf .next && rm -rf out && rm -rf .open-next",
        );

        project.addTask("clean-tsc", {
            description:
                "Clean up the TypeScript incremental compilation cache",
            exec: "rm *.tsbuildinfo",
        });

        const devTask = project.tasks.tryFind("dev") ?? project.addTask("dev");
        devTask.reset("next dev");
        devTask.description = "Start Next.js development server";

        const compileWebAppTask = project.tasks.addTask("compile-webapp", {
            exec: "next build",
            receiveArgs: true,
        });
        project.compileTask.spawn(compileWebAppTask);

        const startTask =
            project.tasks.tryFind("start") ?? project.addTask("start");
        startTask.reset("next start");
        startTask.description = "Start Next.js production server";
    }
}
