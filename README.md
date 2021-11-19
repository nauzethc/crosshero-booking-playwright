# crosshero-booking-playwright

Book your CrossHero.com classes from terminal with Node.js. If class is full, you are signed into waiting list by default.

## Setup

```
npm install
```

Set your credentials in `config.js` file.

```
...
  email: 'user@email.com',
  password: 'secr3t'
...
```

Optional: Enable Telegram notifications with your Bot settings and set `telegram.enabled` to `true`.

```
...
telegram: {
  enabled: true,
  token: 'HASH_ID',
  chatId: 'CHAT_ID'
}
...
```

## Run

Get your desired program ID from CrossHero web to use it on automated process.

Tip: Go to any class of your desired program and copy `program_id` value from the URL.

```
node index.js -p PROGRAM_HASH -d "DD/MM/YYYY" -t "HH:MM"
```


## Run with Docker

`docker-compose.yml` is ready to install from official [Playwright](https://hub.docker.com/_/microsoft-playwright)
image from repositories.
Also you can configure `crontab` which is registered within container to run automated bookings.

### Run Docker container
```bash
docker-compose up --build -d
```
### Bug: If Playwright doesn't install Chromium from Dockerfile, install manually
```bash
docker exec -it --user pwuser CONTAINER_ID /bin/bash
your-container:~/app$ npx playwright install chromium
```

### Book class from container
```bash
docker exec -it --user pwuser CONTAINER_ID /bin/bash
your-container:~/app$ node index.js -p PROGRAM_HASH -d "DD/MM/YYYY" -t "HH:MM"

# Or configure your crontab to automate tasks
your-container:~/app$ crontab -e
```
