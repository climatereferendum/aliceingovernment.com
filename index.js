import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'
import { flag, name as countryName, countries } from 'country-emoji'
import shave from 'shave'
import solutions from './solutions'
import config from './config'

const { fetch, FormData } = window

const PREVIEW_VOTES_COUNT = 5
const SHAVED_HEIGHT = 50
const EXCLUDED_COUNTRY_CODES = ['EU']
const countryCodes = Object.keys(countries)
  .filter(code => !EXCLUDED_COUNTRY_CODES.includes(code))
  .sort((first, second) => countryName(first) < countryName(second) ? -1 : 1)
let active, slug
let myVote
const cache = []
let selectedSolutions = []

const stickyNav = document.querySelector('.sticky-nav')
const form = document.querySelector('#vote-form')
renderCountriesDropdown()
form.addEventListener('submit', (event) => {
  event.preventDefault()
  event.stopPropagation()
  handleSubmit(event)
  return false
})

async function handleSubmit (event) {
  document.querySelector('button[type=submit]').classList.add('inactive')
  document.querySelector('#prevBtn').classList.add('inactive')
  document.querySelector('#submitting').classList.remove('inactive')
  const data = new FormData(form)
  const draft = {}
  for (const key of data.keys()) { (draft[key] = data.get(key)) }
  draft.solutions = [...selectedSolutions]
  // vote ready to submit
  const castedVoteResponse = await fetch(config.serviceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft)
  })
  document.querySelector('#submitting').classList.add('inactive')
  if (castedVoteResponse.ok) {
    console.log('VOTE SUBMISSION SUCCEEDED')
    document.querySelector('button[type=submit]').classList.add('inactive')
    document.querySelector('#please-confirm').classList.remove('inactive')
  } else {
    console.log('VOTE SUBMISSION FAILED')
    document.querySelector('#prevBtn').classList.remove('inactive')
    document.querySelector('button[type=submit]').classList.remove('inactive')
    // if status 409 - vote for that email exists
    if (castedVoteResponse.status === 409) {
      document.querySelector('#vote-exists').classList.remove('inactive')
    }
  }
}

function showForm () {
  // show form, hide navigation
  stickyNav.classList.add('inactive')
  form.classList.remove('inactive')
  document.querySelector('.sticky-select').classList.add('inactive')
  form.scrollIntoView(false)
}

function hideForm () {
  // hide form, show navigation and footer
  form.classList.add('inactive')
  stickyNav.classList.remove('inactive')
  document.querySelector('.sticky-select').classList.remove('inactive')
}

function updateSelectedSolutions (event) {
  if (event.target.checked) {
    selectedSolutions.push(event.target.value)
  } else {
    selectedSolutions = selectedSolutions.filter(s => s !== event.target.value)
  }
  // update select x more counter
  document.querySelector('.sticky-select span').innerHTML = 3 - selectedSolutions.length
  const solutionElements = document.querySelectorAll('#vote .project-box')
  if (selectedSolutions.length === 3) {
    // hide other solutions
    for (const element of solutionElements) {
      if (!selectedSolutions.includes(element.dataset.rank)) {
        element.classList.add('inactive')
      }
    }
    showForm()
  } else {
    // show all solutions
    for (const element of solutionElements) {
      element.classList.remove('inactive')
    }
    hideForm()
  }
}

const pages = document.querySelectorAll('.page')
const nav = {
  vote: document.querySelector('#nav-vote'),
  voters: document.querySelector('#nav-voters'),
  info: document.querySelector('#nav-info')
}

;(async () => {
  renderSolutions(solutions)
  installRouter(handleRouting)
  if (window.location.pathname.split('/')[1] === 'voters') {
    const myVoteId = window.location.pathname.split('/')[2]
    if (myVoteId) {
      const myVoteResponse = await fetch(`${config.serviceUrl}/votes/${myVoteId}`)
      myVote = await myVoteResponse.json()
    }
  }
  const statsResponse = await fetch(`${config.serviceUrl}`, { credentials: 'include' })
  const stats = await statsResponse.json()
  const countries = stats.country
  document.querySelector('#voters').addEventListener('click', unshave)
  renderVotes(stats)
  handleRouting(window.location)
  for await (const country of countries) {
    await new Promise(resolve => setTimeout(resolve))
    const element = document.querySelector(`#voters-${country.code}`)
    render(countryShortTemplate(country), element)
    if (active === 'voters') shaveOpinions(element)
  }
})()

function unshave (event) {
  let element = event.target
  if (element.classList.contains('js-shave-char')) {
    element = element.parentElement
  }
  const char = element.querySelector('.js-shave-char')
  const text = element.querySelector('.js-shave')
  if (char && text) {
    char.style.display = 'none'
    text.style.display = 'inline'
  }
}

function shaveOpinions (element) {
  shave(element.querySelectorAll('.opinion'), SHAVED_HEIGHT)
}

async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  for (const page of pages) {
    page.classList.add('inactive')
  }
  hideForm()
  for (const n in nav) {
    nav[n].classList.remove('active')
    nav[n].classList.remove('active-prev')
  }
  active = location.pathname.split('/')[1]
  slug = location.pathname.split('/')[2]
  let linkedHeader = true
  if (active === '') {
    document.querySelector('#home').classList.remove('inactive')
    linkedHeader = false
  } else {
    document.querySelector(`#${active}`).classList.remove('inactive')
  }
  renderHeader(linkedHeader)
  if (active === 'voters') {
    nav['vote'].classList.add('active-prev')
    nav['voters'].classList.add('active')
    if (slug) {
      const template = html`
        <div class="my-vote info-box">Congratulations, you are voter # <strong>${myVote.index}</strong> from <strong>${countryName(myVote.nationality)}</strong></div>
        <div class="vertical-line-small"></div>
        ${countryShortTemplate({ code: myVote.nationality, vote: [myVote] })}
      `
      if (document.querySelector('#my-vote')) {
        render(template, document.querySelector('#my-vote'))
      }
    } else {
      if (document.querySelector('#my-vote')) {
        document.querySelector('#my-vote').classList.add('inactive')
      }
    }
    const elements = document.querySelectorAll('#voters .country-votes')
    for await (const element of elements) {
      await new Promise(resolve => setTimeout(resolve))
      shaveOpinions(element)
    }
  }
  if (active === 'vote') {
    nav['vote'].classList.add('active')
    if (selectedSolutions.length === 3) {
      showForm()
    }
  }
  if (active === 'info') {
    nav['vote'].classList.add('active-prev')
    nav['voters'].classList.add('active-prev')
    nav['info'].classList.add('active')
  }
  if (active === 'countries' && slug) {
    nav['vote'].classList.add('active-prev')
    nav['voters'].classList.add('active')
    let country = cache.find(c => c.code === slug)
    if (!country) {
      const countryResponse = await fetch(`${config.serviceUrl}/countries/${slug}`)
      country = await countryResponse.json()
      cache.push(country)
    }
    if (active !== 'countries') return // check again if route didn't change
    renderCountry(country)
    document.querySelector('#country').classList.remove('inactive')
  }
  if (active === 'privacy-policy' || active === 'terms-of-service') {
    stickyNav.classList.add('inactive')
  }
}

function renderCountriesDropdown () {
  const template = html`
    <p><select name="nationality" onchange="this.className = ''">
        <option value=''>Select country</option>
      ${countryCodes.map(code => html`
        <option value="${code.toLowerCase()}">${countryName(code)} ${flag(code)}</option>
      `)}
    </select></p>
  `
  render(template, document.querySelector('#nationality'))
}

function renderHeader (linked = true) {
  let headerTemplate = html`
    Alice in Government
  `
  if (linked) {
    headerTemplate = html`
    <a href="/">
      ${headerTemplate}
    </a>
    `
  }

  render(headerTemplate, document.querySelector('#header'))
}

function solutionTemplate (solution) {
  return html`
    <div class="project-box col-xs-6" data-rank=${solution.rank}>
      <a href="${solution.link}" target="drawdown">
      <h4>Solution #${solution.rank}</h4>
      <h3>${solution.name}</h3>
      <span><i>-- read more</i></span>
      </a>
      <label class="container">
        <input
          type="checkbox"
          name="solution-${solution.rank}"
          value="${solution.rank}"
          @change="${updateSelectedSolutions}">
        <span class="checkmark"><span>VOTE</span></span>
      </label>      
    </div>
  `
}

function renderSolutions (solutions) {
  const solutionsHeader = html`
      <div class="vertical-line-small"></div>
      <div class="info-box" style="text-align:center">
      Nothing seems to work when it comes to changing politics 
      and that's why we created this platform, so that those making decisions are everyday citizens.
      </div>
      <div class="vertical-line-small"></div>
      <div class="info-box info-box-short" style="text-align:center">
        Over the Internet. <br> Without institutions.
      </div>
      <div class="vertical-line-small"></div>
      <div class="info-box" style="text-align:center">
        Scientists and academics at <a href="https://www.drawdown.org/solutions-summary-by-rank" target="_blank"><u><i>Project Drawdown</i></u></a> -over 200 of them-
        have ranked the top 15 climate change solutions <strong>in order of greatest impact</strong>.
      </div>
      <div class="vertical-line-small not-voted"></div>
      <div class="info-box info-box-medium not-voted" style="text-align:center">
        <strong>By selecting 3 solutions</strong>,<br>
        we can reach a citizen consensus <br> on climate change priorities.
      </div>
      <div class="vertical-line-small"></div>
    <div class="row" style="max-width: 100vw;">
      <div class="select-block not-voted">SELECT 3</div>
    </div>
    <div class="sticky-select not-voted">
      <div>Select <span>3</span> more solutions</div>
    </div>
  `

  const solutionsTemplate = html`
    ${solutionsHeader}
    ${solutions.map(solutionTemplate)}
  `
  render(solutionsTemplate, document.querySelector('#vote'))
}

function loadMoreLink (country) {
  if (country.count > PREVIEW_VOTES_COUNT) {
    return html`<a href="/countries/${country.code.toLowerCase()}"><i>load more ↓</i></a>`
  }
}

function countryShortTemplate (country) {
  return html`
    <div class="project-box votes">
      <h2>
        ${flag(country.code)}
        ${countryName(country.code)}
      </h2>
      <span class="counter">${country.count} Votes</span>
    </div>
    <div class="project-box solution content">
        <ul class="country-votes">
          ${country.vote.map(voteTemplate)}
        </ul>
        ${loadMoreLink(country)}
    </div>
    <div class="vertical-line"></div>
  `
}

function renderVotes (stats) {
  const pageTemplate = html`
    <div>
      <div class="vertical-line-small"></div>
      <div id="my-vote"></div>
      <div class="project-box solution info-box">
        <h3>Check out what other voters have said:</h3>
        <strong>Total # of Voters</strong>: ---<strong>${stats.global.count}</strong>
        <br>
        <strong>Countries</strong>: ---<strong> ${stats.country.length} </strong>
      </div>
      <div class="vertical-line-small"></div>
      ${stats.country.map(c => html`<div id="voters-${c.code}"></div>`)}
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}

function voteTemplate (vote) {
  return html`
  <li>
    <div>
      <em class="index">${vote.index}</em>
      <strong>${vote.name}</strong>
      <em>${vote.description}</em>
    </div>
    <div class="opinion">${vote.opinion}</div>
  </li>
  `
}

function renderCountry (country) {
  const countryTemplate = html`
    <div class="project-box votes">
      <h2>
        ${flag(country.code)}
        ${countryName(country.code)}
      </h2>
      <span class="counter">${country.count} VOTES</span>
    </div>
    <div class="project-box solution">
      <ul class="country-votes">${country.vote.map(voteTemplate)}</ul>
    </div>
  `
  const pageTemplate = html`
    <div>
      ${countryTemplate}
    </div>
  `

  render(pageTemplate, document.querySelector('#country'))
}
