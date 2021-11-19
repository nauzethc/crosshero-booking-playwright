#!/bin/bash

# Counting 5 days from today, try to book 18:30 session
/usr/bin/env node /home/pwuser/app/index.js \
	-p 5b6bee98bd32390034f0c594 \
	-d "`date -d '+5 days' +'%d/%m/%Y'`" \
	-t "18:30" \
	>> /home/pwuser/app/bookings.log