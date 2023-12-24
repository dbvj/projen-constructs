import { monorepo } from "@aws/pdk";
import { ProjectOptions, javascript } from "projen";
import { NodeProjectOptions } from "projen/lib/javascript";
import {
    TypeScriptProject,
    TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { Nvmrc } from "./packages/projen-nvm/src";
import { VsCodeWorkspaces } from "./packages/projen-vscode-workspaces/src";

const SHIMS_FOR_VSCODE = {
    tsconfig: {
        fileName: "tsconfig.publish.json",
        compilerOptions: {},
    },
    tsconfigDev: {
        fileName: "tsconfig.json",
        compilerOptions: {},
    },
};

const COMMON_PROJECT_OPTIONS: Omit<
    ProjectOptions & NodeProjectOptions & TypeScriptProjectOptions,
    "defaultReleaseBranch" | "name"
> = {
    ...SHIMS_FOR_VSCODE,
    minNodeVersion: "18.12.0",
    maxNodeVersion: "20.10.0",
    workflowNodeVersion: "20.10.0",

    packageManager: javascript.NodePackageManager.PNPM,
    pnpmVersion: "8",

    eslint: true,

    prettier: true,
    prettierOptions: {
        settings: {
            tabWidth: 4,
        },
    },

    jestOptions: {
        configFilePath: "jest.config.json",
    },
};
const rootProject = new monorepo.MonorepoTsProject({
    ...COMMON_PROJECT_OPTIONS,
    devDeps: ["@aws/pdk", "@types/jest"],
    name: "projen-constructs",

    projenrcTs: true,
    github: true,
});

const workspacesProject = new TypeScriptProject({
    ...COMMON_PROJECT_OPTIONS,
    parent: rootProject,
    name: "projen-vscode-workspaces",
    defaultReleaseBranch: "main",
    outdir: "packages/projen-vscode-workspaces",

    peerDeps: ["constructs", "projen"],
    devDeps: ["constructs", "projen"],
});

workspacesProject.tsconfig?.addExclude("src/**/*.test.ts");

workspacesProject.tasks
    .tryFind("compile")
    ?.reset(`tsc --build ${workspacesProject.tsconfig?.fileName}`);

const nvmProject = new TypeScriptProject({
    ...COMMON_PROJECT_OPTIONS,
    parent: rootProject,
    name: "projen-nvm",
    defaultReleaseBranch: "main",
    outdir: "packages/projen-nvm",

    peerDeps: ["constructs", "projen"],
    devDeps: ["constructs", "projen"],
});

nvmProject.tsconfig?.addExclude("src/**/*.test.ts");
nvmProject.tasks
    .tryFind("compile")
    ?.reset(`tsc --build ${nvmProject.tsconfig?.fileName}`);

// Using the packages inside this repo, for this repo

new VsCodeWorkspaces(rootProject, {
    filename: "Projen Constructs Monorepo.code-workspace",
});

new Nvmrc(rootProject);

rootProject.synth();
