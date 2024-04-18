sudo apt update
sudo apt install unzip
`sudo apt-get update
sudo apt-get upgrade`

`nano ~/.bashrc`

# Запуск ssh-agent и добавление ключа

if [ -z "$SSH_AUTH_SOCK" ]; then
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa
fi
eval $(keychain --eval --agents ssh id_rsa)
alias log='tail -f -n 100'
alias cdp='cd /opt/mev'

```
chmod 600 /root/.ssh/id_rsa

source ~/.bashrc

apt install keychain


cd /opt/

apt install git

```

```

git clone git@github.com:andriibezkorovainyi/mev.git

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

source ~/.bashrc

nvm install 18 --lts

```

```

npm i -g yarn pm2@latest

sudo apt install lsb-release
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install redis
sudo systemctl enable redis-server
```

# mev

find a path to bun executable

Move it to /usr/local/bin

```bash
sudo ln -s /home/username/.bun/bin/bun /usr/local/bin/bun
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run main.ts
```

This project was created using `bun init` in bun v1.0.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
