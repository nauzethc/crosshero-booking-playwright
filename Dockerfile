FROM mcr.microsoft.com/playwright:focal

# Install cron
RUN apt update && apt install -y cron

# Change unprivileged user
WORKDIR /home/pwuser/app
COPY package.json ./
RUN chown -R pwuser:pwuser .
USER pwuser

# Install dependendies
RUN npm install && touch bookings.log

# Copy source code and install crontab
COPY *.js register.sh crontab ./
RUN crontab ./crontab

# Run cron and keep container up
USER root
CMD service cron start && tail -F /home/pwuser/app/bookings.log
