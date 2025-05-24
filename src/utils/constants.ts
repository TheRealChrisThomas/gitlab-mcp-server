export const GITLAB_PERSONAL_ACCESS_TOKEN = process.env.GITLAB_PERSONAL_ACCESS_TOKEN;
export const GITLAB_API_URL = process.env.GITLAB_API_URL || "https://gitlab.com/api/v4";

if (!GITLAB_PERSONAL_ACCESS_TOKEN) {
  console.error("GITLAB_PERSONAL_ACCESS_TOKEN environment variable is not set");
  process.exit(1);
}

export const DEFAULT_HEADERS = {
  Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`,
  "Content-Type": "application/json"
};

export const AUTH_HEADERS = {
  Authorization: `Bearer ${GITLAB_PERSONAL_ACCESS_TOKEN}`
};
