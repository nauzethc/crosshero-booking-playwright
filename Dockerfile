FROM mcr.microsoft.com/playwright:focal

# Install cron
RUN apt update && apt install -y cron
RUN service cron start

# Change unprivileged user
WORKDIR /home/pwuser/app
COPY *.js package.* crontab ./
RUN chown -R pwuser:pwuser .
USER pwuser

# Install dependendies
RUN npm install
RUN crontab ./crontab