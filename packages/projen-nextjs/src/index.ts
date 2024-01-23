import nextJest from "next/jest";
import { Component } from "projen";
import {
    TypeScriptJsxMode,
    TypeScriptModuleResolution,
    TypescriptConfig,
} from "projen/lib/javascript";
import { TypeScriptProject } from "projen/lib/typescript";

export const NEXTJS_TSCONFIG_OPTIONS: TypescriptConfig = {
    include: ["**/*.ts", "**/*.tsx", "next-env.d.ts", ".next/types/**/*.ts"],
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
    },
};

export interface NextjsEslintOptions {}

export class NextjsEslint extends Component {
    constructor(
        project: TypeScriptProject,
        private readonly options: NextjsEslintOptions = {},
    ) {
        super(project);

        if (project.eslint) {
            const nextDep = project.deps.tryGetDependency("next");
            const nextVersionSuffix = nextDep?.version
                ? `@${nextDep?.version}`
                : "";
            project.addDevDeps(`@next/eslint-plugin-next${nextVersionSuffix}`);

            const conflictingRules = ["jsx-a11y/anchor-is-valid"];

            for (const rule of conflictingRules) {
                if (project.eslint.rules?.[rule]) {
                    project.eslint.addRules({ [rule]: "off" });
                }
            }
        }
    }
}

export interface NextjsJestOptions {
    dir?: string;
}

export class NextjsJest extends Component {
    declare readonly project: TypeScriptProject;

    constructor(
        project: TypeScriptProject,
        private readonly options: NextjsJestOptions = {},
    ) {
        super(project);
    }

    override preSynthesize(): void {
        if (this.project.jest) {
            const nextJester = nextJest({ dir: this.options?.dir });

            const newJestConfig = nextJester(this.project.jest.config);
            // @ts-expect-error - Readonly violation
            this.project.jest.config = newJestConfig;
        }
    }
}