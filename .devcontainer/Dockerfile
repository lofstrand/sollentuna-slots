FROM node:24

# --- Timezone ---
ARG TZ
ENV TZ="$TZ"

# --- System packages ---
# Core dev tools, shell utilities, and package manager dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  less \
  git \
  procps \
  sudo \
  fzf \
  zsh \
  man-db \
  unzip \
  gnupg2 \
  gh \
  iproute2 \
  dnsutils \
  jq \
  nano \
  vim \
  wget \
  apt-transport-https \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# --- git-delta (improved diff viewer) ---
ARG GIT_DELTA_VERSION=0.18.2
RUN ARCH=$(dpkg --print-architecture) && \
  wget "https://github.com/dandavison/delta/releases/download/${GIT_DELTA_VERSION}/git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb" && \
  dpkg -i "git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb" && \
  rm "git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb"

# --- Non-root user setup (node) ---
ARG USERNAME=node

# Passwordless sudo for the node user
RUN echo "node ALL=(root) NOPASSWD: ALL" > /etc/sudoers.d/node && \
  chmod 0440 /etc/sudoers.d/node

# Persist shell history across container rebuilds (mounted volume)
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  && mkdir /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory

# Prepare directories with correct ownership
RUN mkdir -p /usr/local/share/npm-global && \
  chown -R node:node /usr/local/share && \
  mkdir -p /workspace /home/node/.claude && \
  chown -R node:node /workspace /home/node/.claude

WORKDIR /workspace
ENV DEVCONTAINER=true

# --- Switch to non-root user ---
USER node

# --- Shell (zsh + powerlevel10k) ---
ENV SHELL=/bin/zsh
ENV EDITOR=nano
ENV VISUAL=nano

ARG ZSH_IN_DOCKER_VERSION=1.2.0
RUN sh -c "$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v${ZSH_IN_DOCKER_VERSION}/zsh-in-docker.sh)" -- \
  -p git \
  -p fzf \
  -a "source /usr/share/doc/fzf/examples/key-bindings.zsh" \
  -a "source /usr/share/doc/fzf/examples/completion.zsh" \
  -a "export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  -x

# --- npm global config (for React/frontend tooling) ---
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# --- CLI tools (installed as node user) ---

# Claude Code
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH=$PATH:/home/node/.local/bin

# Codex CLI
ARG CODEX_VERSION=latest
RUN npm install -g @openai/codex@${CODEX_VERSION}
