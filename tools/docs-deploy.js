const fs = require('fs').promises;
const path = require('path');
const ghpages = require('gh-pages');
const Git = require('gh-pages/lib/git');
const argv = require('minimist')(process.argv.slice(2));
const gitParse = require('git-url-parse');

const git = new Git(process.cwd(), 'git');

async function deploy(docsDir) {
  try {
    await fs.access(docsDir);
  } catch (err) {
    if (argv.v || argv.verbose) console.warn(err);
    return;
  }

  const actor = process.env.GITHUB_ACTOR || process.env.GIT_AUTHOR_NAME;
  const token = process.env.GITHUB_TOKEN;

  if (!actor) throw new Error('You must specify an actor whom performs the commit using GITHUB_ACTOR env variable');
  if (!token) throw new Error('You must specify a token authenticating the commit using GITHUB_TOKEN env variable');

  const metadata = require(path.resolve(process.cwd(), 'package.json'));
  const origin = await git.getRemoteUrl('origin');
  const { resource, full_name } = gitParse(origin);
  const url = `https://${actor}:${token}@${resource}/${full_name}.git`;
  const message = `documentation v${metadata.version}`;

  return new Promise((resolve, reject) => {
    ghpages.publish(
      docsDir,
      {
        repo: url,
        message: `chore(release): ${message} [skip ci]`,
      },
      (err) => {
        if (err) reject(err);
        resolve({ name: full_name, message });
      },
    );
  });
};

deploy(argv._.length ? path.resolve(argv._[0]) : path.resolve(process.cwd(), 'output', 'docs'))
  .then((status) => {
    if (status) console.log(`\n\x1b[36mDeploying "${status.message}" to GitHub Pages for repo ${status.name}\x1b[0m\n`);
    else console.warn(`\n\x1b[33mNo documentation or insufficient rights, skipping deploy\x1b[0m\n`);
  })
  .catch((err) => {
    if (argv.v || argv.verbose) console.error(err);
    console.error(`\n\x1b[31mFailed to publish documentation to GitHub Pages\x1b[0m\n`);
    process.exit(1);
  });


