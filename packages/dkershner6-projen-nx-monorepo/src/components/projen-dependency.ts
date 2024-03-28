import { PROJEN_VERSION } from "dkershner6-projen-typescript";
import { DependencyType, Project } from "projen";

export const DEFAULT_PROJEN_VERSION = PROJEN_VERSION;

/**
 * Synchronize all subproject projen versions to the given projen version
 */
export const syncProjenVersions = (
    subProjects: Project[],
    projenVersion: string = DEFAULT_PROJEN_VERSION,
): void => {
    subProjects.forEach((subProject) => {
        // Set the projen version to one consistent with the monorepo for any node projects
        const projenDependencies = subProject.deps.all.filter(
            (d) => d.name === "projen" && d.type !== DependencyType.RUNTIME,
        );
        projenDependencies.forEach((d) => {
            subProject.deps.removeDependency(d.name, d.type);
            subProject.deps.addDependency(
                `projen@${projenVersion}`,
                d.type,
                d.metadata,
            );
        });
    });
};
