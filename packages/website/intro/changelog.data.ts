import {promises as fs} from 'fs';


interface ICommitGroups {
    title: number;
    commits: string[];
}

interface IRelease {
    version: string;
    versionLink: string;
    description?: string;
    breaking?: string;
    commitGroups: ICommitGroups[];
}

interface IData {
    releases: IRelease[];
}

const config = globalThis.VITEPRESS_CONFIG

export default {
    watch: ['./changelog.json'],
    async load(watchesFiles): Promise<IData> {
        const { createMarkdownRenderer } = await import('vitepress');
        const md = await createMarkdownRenderer(config.srcDir, config.markdown, config.site.base, config.logger);

        const dataRaw = await fs.readFile(watchesFiles[0]);
        const dataJson = JSON.parse(dataRaw.toString()) as IData;

        for (const release of dataJson.releases) {
            release.versionLink = '_' + release.version.replace(/\./g, '-');

            if (release.description) {
                release.description = md.render(release.description);
            }

            if (release.breaking) {
                release.breaking = md.render(release.breaking);
            }

            for (const commitGroup of release.commitGroups) {
                commitGroup.commits = commitGroup.commits.map((commit) => md.render(commit));
            }
        }

        return dataJson;
    }
}
