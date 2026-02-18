#!/usr/bin/env node
const { execSync } = require("child_process");

function getGitLogs() {
  try {
    // 1. Get the timestamp for "Start of Day" (Midnight today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sinceDate = today.toISOString();

    console.log(
      `Scanning for commits since: ${today.toLocaleDateString()}...\n`
    );

    // 2. The Magic Git Command
    // --no-pager: Prevents it from opening in 'less' or 'vim'
    // --since: Filters for today only
    // --pretty: Formats it nicely (Hash + Message + Date)
    // --name-only: Lists the files changed (Crucial context for the AI!)
    const command = `git --no-pager log --since="${sinceDate}" --pretty=format:"COMMIT: %s (%h)" --name-only`;

    //  Execute the command
    const output = execSync(command).toString();

    if (!output.trim()) {
      console.log("No work found today. Go write some code!");
      return null;
    }

    return output;
  } catch (error) {
    console.error("Error: Are you currently inside a Git repository?");
    return null;
  }
}

// --- MAIN EXECUTION ---
const rawData = getGitLogs();

if (rawData) {
  console.log("CAPTURED CONTEXT:");
  console.log("-------------------------------------------------");
  console.log(rawData);
  console.log("-------------------------------------------------");
  console.log("READY TO SEND TO AI");
}
