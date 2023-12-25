import { TextFile } from "projen";

import {
    TypeScriptProject,
    TypeScriptProjectOptions,
} from "projen/lib/typescript";
import { COMMON_PROJECT_OPTIONS } from "./options";
import { NodeMonorepoChildReleaseWorkflow } from "../../packages/projen-github-workflows/src/NodeMonorepoChildReleaseWorkflow";
import { RootMonorepo } from "../rootMonorepo";

export class ProjenConstructTsLib extends TypeScriptProject {
    private readonly combinedOptions: TypeScriptProjectOptions;

    constructor(
        private readonly rootMonorepoProject: RootMonorepo,
        options: Omit<
            TypeScriptProjectOptions,
            "defaultReleaseBranch" | "outDir"
        >,
    ) {
        const combinedOptions: TypeScriptProjectOptions = {
            parent: rootMonorepoProject,
            ...COMMON_PROJECT_OPTIONS,
            ...options,

            defaultReleaseBranch: "main",
            outdir: `packages/${options.name}`,
            releaseTagPrefix: `${options.name}@`,
            release: true,
            releaseToNpm: true,

            peerDeps: ["constructs", "projen", ...(options.peerDeps ?? [])],
            devDeps: ["constructs", "projen", ...(options.devDeps ?? [])],

            authorName: "Derek Kershner",
            authorUrl: "https://dkershner.com",
            docgen: true,
            docsDirectory: `../../docs/${options.name}`,
        };

        super(combinedOptions);

        this.combinedOptions = combinedOptions;

        this.tsconfig?.addExclude("src/**/*.test.ts");
        this.tasks
            .tryFind("compile")
            ?.reset(`tsc --build ${this.tsconfig?.fileName}`);

        new TextFile(this, "README.md", {
            lines: [
                `# ${this.name}`,
                "",
                `${this.combinedOptions.description}`,
                "",
                "## Docs",
                "",
                `See [${this.name} API Docs](https://dkershner6.github.io/projen-constructs/${this.name})`,
                "",
                "## Usage",
                "",
                "Install the module:",
                "",
                "```typescript",
                `devDeps: ["${this.name}"]`,
                "```",
                "",
                "Import into your code:",
                "",
                "```typescript",
                `import { WhateverConstruct } from "${this.name}";`,
                "```",
                "",
                "## License",
                "",
                "This project is licensed under the terms of the [MIT License](LICENSE.md).",
            ],
        });

        new NodeMonorepoChildReleaseWorkflow(this.rootMonorepoProject, this, {
            branches: ["main"],
            releaseToNpm: combinedOptions.releaseToNpm,
        });
    }
}
