const github = require("@actions/github");
const puppeteer = require("puppeteer-core");

const getFileSha = async (octokit, pdfPath, owner, repo, branch = "main") => {
  const pdfContent = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: pdfPath,
    ref: `heads/${branch}`,
  });
  return pdfContent.data.sha;
};

const getPdfBase64 = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://blog.risingstack.com', {waitUntil: 'networkidle0'});
  const pdf = await page.pdf({ format: 'a4' });

  await browser.close();

  return pdf.toString("base64");
};

const getDateTime = () => {
  let currentdate = new Date();
  return (datetime =
    "Last Sync: " +
    currentdate.getDate() +
    "/" +
    (currentdate.getMonth() + 1) +
    "/" +
    currentdate.getFullYear() +
    " @ " +
    currentdate.getHours() +
    ":" +
    currentdate.getMinutes());
};

const uploadToRepo = async (
  octokit,
  pdfPath,
  pdfBase64,
  owner,
  repo,
  branch
) => {
  const fileSha = await getFileSha(octokit, pdfPath, owner, repo, branch);
  const datetime = getDateTime();
  const result = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    branch,
    message: `updating Resume pdf, ${datetime}`,
    path: pdfPath,
    content: pdfBase64,
    sha: fileSha,
  });
  console.log(`Created commit at ${result.data.commit.html_url}`);
};

const main = async () => {
  let GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const octokit = github.getOctokit(GITHUB_TOKEN);

  const OWNER = process.env.GITHUB_OWNER;
  const REPO = process.env.GITHUB_REPO;
  const BRANCH = process.env.GITHUB_BRANCH;
  const PDF_PATH = process.env.PDF_NAME;
  const pdfBase64 = await getPdfBase64();
  await uploadToRepo(octokit, PDF_PATH, pdfBase64, OWNER, REPO, BRANCH);
};

main();
