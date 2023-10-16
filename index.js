const notify = require('./notify')
const { webkit } = require('playwright')
const { options, crosshero } = require('./config')
const { program } = require('commander')

// Set logging
const log = require('simple-node-logger').createSimpleLogger(options.log)

// Set options
program.version('0.0.1')
program.requiredOption('-p, --program-id <id>', 'CrossHero program ID')
program.requiredOption(
  '-d, --date <date>',
  'Date schedule in "DD/MM/YYYY" format'
)
program.requiredOption('-t, --time <time>', 'Class time in "HH:MM" format')

// Parse arguments
program.parse(process.argv)
const { programId, date, time } = program.opts()

if (programId && date && time) {
  main()
} else {
  console.log('Input params mandatory: program-id, date, time')
}

async function timer(seconds = 3) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000)
  })
}

// Main
async function main() {
  // Load browser
  const browser = await webkit.launch(options.browser)
  const context = await browser.newContext()
  const page = await context.newPage()

  // Step 1: Login
  try {
    await page.goto(`${crosshero.baseUrl}/athletes/sign_in`)
    await page.waitForSelector('form#new_athlete')
    await page.type('form#new_athlete #athlete_email', crosshero.email)
    await page.type('form#new_athlete #athlete_password', crosshero.password)
    // Fix: wait some time to enable reCAPTCHA validation
    await timer(3)

    log.info('Sending credentials to CrossHero.com...')
    await Promise.all([
      page.waitForNavigation(),
      await page.click('form#new_athlete input[type=submit]')
    ])
  } catch (err) {
    log.error('Something was wrong:')
    log.error(err)
    return browser.close()
  }

  // Step 2: Check login
  try {
    await page.waitForSelector('main#dashboard')
    log.info('Login success')
  } catch (loginError) {
    log.error('Login error')
    log.error(loginError)
    return browser.close()
  }

  // Step 3: Go to program/day schedule page
  try {
    const query = `date=${date}&program_id=${programId}`
    log.info('Looking for program on given day...')
    await page.goto(`${crosshero.baseUrl}/dashboard/classes?${query}`)
  } catch (dayNotFound) {
    log.error('Given day has not any classes open yet')
    return browser.close()
  }

  // Step 4: Retrieve class schedule and get class ID
  const classes = {}
  try {
    log.info('Retrieving day schedule...')
    await page.waitForSelector('select#class_reservation_single_class_id')
    const schedule = await page.evaluate(() => {
      const selector = 'select#class_reservation_single_class_id option'
      return Object.fromEntries(
        [...document.querySelectorAll(selector)]
          .filter(node => !!node.value)
          .map(node => [node.textContent, node.value])
      )
    })
    Object.assign(classes, schedule)
    log.info(JSON.stringify(classes, null, 2))
  } catch (err) {
    log.error('Schedule not found')
    return browser.close()
  }

  // Step 5: Go to class page
  const classId = classes[time]
  if (!classId) {
    log.error('Class not found on seleted day/program schedule')
    return browser.close()
  } else {
    try {
      log.info('Selecting time for day/program schedule')
      await page.goto(`${crosshero.baseUrl}/dashboard/classes?id=${classId}`)
    } catch (err) {
      log.error(err)
      return browser.close()
    }
  }

  // Step 6: Book class
  try {
    log.info(`Trying to book ${time} (${classId}) class...`)
    await page.waitForSelector('#classes-sign-in', options.page)
    await Promise.all([
      page.waitForNavigation(options.page),
      page.click('#classes-sign-in')
    ])
  } catch (classIsFull) {
    try {
      log.info('Trying to sign in waiting list...')
      await page.waitForSelector('#classes-waiting-list', options.page)
      await Promise.all([
        page.waitForNavigation(options.page),
        page.click('#classes-waiting-list')
      ])
    } catch (classNotOpen) {
      log.info('Class bookings are not open yet')
      return browser.close()
    }
  }

  // Step 7: Check process and notify
  const check = { status: '', message: '' }

  // Check is booked on class
  try {
    await page.waitForSelector('.alert-info', options.page)
    check.status = 'success'
    check.message = `CrossHero class at ${time} (${date}) was booked successfully`
  } catch { }

  // Check is on waiting list
  try {
    await page.waitForSelector(
      'a[href^="/dashboard/waiting_lists"][data-method=delete]',
      options.page
    )
    check.status = 'warning'
    check.message = `CrossHero class at ${time} (${date}) is full! You are signed in waiting list`
  } catch { }

  // Check if there was a problem
  try {
    await page.waitForSelector('.alert-danger', options.page)
    check.status = 'danger'
    check.message = await page.evaluate(
      () => document.querySelector('.alert-danger p').textContent
    )
  } catch { }

  // Close and exit
  await notify(check.message)
  return browser.close()
}