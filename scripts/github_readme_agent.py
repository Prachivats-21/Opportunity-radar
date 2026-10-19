#!/usr/bin/env python3
"""
Autonomous GitHub & README Synchronization Agent
Maintains a bounded telemetry block in README.md and pushes to GitHub after commands.
"""
import argparse
import datetime
import fcntl
import json
import os
import re
import subprocess
import sys
import time

START_MARKER = "<!-- AUTO-README-AGENT:START -->"
END_MARKER = "<!-- AUTO-README-AGENT:END -->"
MAX_HISTORY_ENTRIES = 10
IGNORED_COMMANDS = {
    "ls", "ll", "la", "cd", "pwd", "clear", "c", "h", "history",
    "exit", "fastfetch", "true", "false", "echo"
}
IGNORED_PREFIXES = (
    "git commit", "git push", "git add", "git pull", "git fetch",
    "git merge", "git rebase", "git checkout", "git switch"
)


def should_skip_command(cmd: str) -> bool:
    if not cmd or not cmd.strip():
        return True
    trimmed = cmd.strip()
    first_token = trimmed.split()[0]
    if first_token in IGNORED_COMMANDS:
        return True
    if any(trimmed.startswith(prefix) for prefix in IGNORED_PREFIXES):
        return True
    if "github_readme_agent.py" in trimmed:
        return True
    return False


def acquire_lock(repo_root: str, timeout: float = 15.0):
    lock_file = os.path.join(repo_root, ".git", "readme_sync.lock")
    start = time.time()
    fd = os.open(lock_file, os.O_CREAT | os.O_RDWR, 0o666)
    while True:
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return fd
        except (BlockingIOError, IOError):
            if time.time() - start >= timeout:
                os.close(fd)
                raise TimeoutError("Could not acquire readme_sync lock")
            time.sleep(0.2)


def release_lock(fd):
    try:
        fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)
    except Exception:
        pass


def run_cmd(cmd, cwd, timeout=15):
    res = subprocess.run(cmd, cwd=cwd, shell=True, capture_output=True, text=True, timeout=timeout)
    return res.returncode, res.stdout.strip(), res.stderr.strip()


def get_git_info(repo_root):
    _, branch, _ = run_cmd("git rev-parse --abbrev-ref HEAD", repo_root)
    _, commit, _ = run_cmd("git rev-parse --short HEAD", repo_root)
    return branch or "master", commit or "unknown"


def update_readme_content(original_content: str, entry: dict, history: list) -> str:
    timestamp = entry.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat())
    branch = entry.get("branch", "master")
    commit = entry.get("commit", "unknown")
    status_icon = "✅ Success" if entry.get("exit_code") == 0 else f"❌ Error ({entry.get('exit_code')})"
    clean_cmd = entry.get("command", "").replace("|", "\\|").replace("`", "")[:60]

    table_rows = []
    for h in reversed(history[-MAX_HISTORY_ENTRIES:]):
        h_icon = "✅" if h.get("exit_code") == 0 else f"❌ ({h.get('exit_code')})"
        h_cmd = h.get("command", "").replace("|", "\\|").replace("`", "")[:50]
        table_rows.append(f"| {h.get('timestamp', '')[:19]} | `{h_cmd}` | {h_icon} | `{h.get('commit', '')}` |")

    block = f"""{START_MARKER}
### 🤖 Autonomous Agent Telemetry & Activity Log
*Auto-updated after commands and executions via OpenCode Agent integration.*

- **Last Command**: `{clean_cmd}` ({status_icon})
- **Last Sync**: `{timestamp}`
- **Active Branch**: `{branch}` (`{commit}`)

| Timestamp (UTC) | Command | Status | Commit |
|:---|:---|:---:|:---:|
""" + "\n".join(table_rows) + f"\n{END_MARKER}"

    if START_MARKER in original_content and END_MARKER in original_content:
        pattern = re.compile(rf"{re.escape(START_MARKER)}.*?{re.escape(END_MARKER)}", re.DOTALL)
        return pattern.sub(block, original_content)
    else:
        return original_content.rstrip() + "\n\n" + block + "\n"


def sync(repo_root: str, command: str, exit_code: int = 0, no_push: bool = False):
    if should_skip_command(command):
        return {"status": "skipped", "reason": "command in ignore list"}

    lock_fd = acquire_lock(repo_root)
    try:
        history_file = os.path.join(repo_root, ".git", "readme_agent_history.json")
        history = []
        if os.path.exists(history_file):
            try:
                with open(history_file, "r") as f:
                    history = json.load(f)
            except Exception:
                history = []

        branch, commit = get_git_info(repo_root)
        entry = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "command": command,
            "exit_code": exit_code,
            "branch": branch,
            "commit": commit
        }
        history.append(entry)
        history = history[-50:]
        with open(history_file, "w") as f:
            json.dump(history, f, indent=2)

        readme_path = os.path.join(repo_root, "README.md")
        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()

        updated = update_readme_content(content, entry, history)
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(updated)

        run_cmd("git add README.md", repo_root)
        clean_msg = command.replace('"', '\\"')[:50]
        run_cmd(f'git commit -m "docs(telemetry): update README after \'{clean_msg}\' [skip ci]"', repo_root)

        if not no_push:
            run_cmd("git push origin master", repo_root, timeout=20)

        return {"status": "success", "synced_command": command}
    finally:
        release_lock(lock_fd)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--command", "-c", type=str, required=True)
    parser.add_argument("--exit-code", "-e", type=int, default=0)
    parser.add_argument("--no-push", action="store_true")
    args = parser.parse_args()
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    result = sync(root, args.command, args.exit_code, no_push=args.no_push)
    print(json.dumps(result))
