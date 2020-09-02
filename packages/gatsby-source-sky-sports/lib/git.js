const { Octokit } = require('@octokit/rest');

class Git {
    constructor({ DEBUG = false, accessToken, repo, owner, baseDir }) {
        const octokit = new Octokit({
            debug: DEBUG,
            auth: accessToken,
        });

        this.baseDir = baseDir;
        this.owner = owner;
        this.repo = repo;
        this.repos = octokit.repos;
        this.gitdata = octokit.git;
        console.log({
            debug: DEBUG,
            auth: accessToken,
        });
    }

    read = (file) =>
        this.repos
            .getContents({
                owner: this.owner,
                repo: this.repo,
                path: `${this.baseDir}/${file}`,
            })
            .then(({ data }) => data)
            .catch(() => ({
                path: `${this.baseDir}/${file}`,
            }));

    push = async ({ content, message, fileToSave }) => {
        const file = await this.read(fileToSave);
        const result = await this.repos.createOrUpdateFile({
            owner: this.owner,
            repo: this.repo,
            path: file.path,
            message,
            sha: file.sha,
            content: Buffer.from(content, 'utf8').toString('base64'),
        });
        return result;
    };

    saveData = ({ data, message, file }) => {
        try {
            return this.push({
                content: JSON.stringify(data, null, 2),
                message: message || '',
                fileToSave: file,
            });
        } catch (e) {
            console.error(e.stack);
            return new Error(e);
        }
    };

    getFile = async (file) => {
        try {
            const res = await this.read(file);
            return JSON.parse(Buffer.from(res, 'base64').toString());
        } catch (e) {
            throw new Error(e);
        }
    };
}

module.exports = Git;
