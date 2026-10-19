# Zsh Shell Hook for Autonomous GitHub & README Agent
# Source this file in ~/.zshrc or your terminal session:
#   source /Users/prachivats21/Downloads/opportunity-radar/scripts/shell_hook.zsh

autoload -Uz add-zsh-hook

_readme_agent_preexec() {
    export _README_AGENT_LAST_CMD="$1"
}

_readme_agent_precmd() {
    local exit_code=$?
    local last_cmd="$_README_AGENT_LAST_CMD"
    unset _README_AGENT_LAST_CMD

    [[ -z "$last_cmd" ]] && return 0

    local repo_root
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
    [[ -z "$repo_root" ]] && return 0

    local agent_script="$repo_root/scripts/github_readme_agent.py"
    [[ ! -f "$agent_script" ]] && return 0

    # Execute completely detached in background so the developer's interactive shell prompt never lags
    nohup python3 "$agent_script" --command "$last_cmd" --exit-code "$exit_code" >/dev/null 2>&1 &!
}

add-zsh-hook preexec _readme_agent_preexec
add-zsh-hook precmd _readme_agent_precmd
