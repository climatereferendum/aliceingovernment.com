import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'
import { flag, name as countryName, countries } from 'country-emoji'
import shave from 'shave'
import solutions from './solutions'
import config from './config'

const { fetch, localStorage, FormData } = window

const PREVIEW_VOTES_COUNT = 5
const SHAVED_HEIGHT = 50
let active, slug
const cache = []
let selectedSolutions = []
let authProviders
let myVote

const savedVote = localStorage.getItem('myVote')
if (savedVote) myVote = JSON.parse(savedVote)

const stickyNav = document.querySelector('.sticky-nav')
const form = document.querySelector('#vote-form')
renderCountriesDropdown()
form.addEventListener('submit', (event) => {
  event.preventDefault()
  event.stopPropagation()
  handleSubmit(event)
  return false
})

function handleSubmit (event) {
  const data = new FormData(form)
  const draft = {}
  for (const key of data.keys()) { (draft[key] = data.get(key)) }
  draft.solutions = [...selectedSolutions]
  localStorage.setItem('data', JSON.stringify(draft))
  window.location = `${config.serviceUrl}${authProviders[event.target.auth]}`
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
  if (!myVote) document.querySelector('.sticky-select').classList.remove('inactive')
}

function updateSelectedSolutions (event) {
  if (event.target.checked) {
    selectedSolutions.push(event.target.value)
  } else {
    selectedSolutions = selectedSolutions.filter(s => s !== event.target.value)
  }
  // update select x more counter
  document.querySelector('.sticky-select span').innerHTML = 3 - selectedSolutions.length
  const solutionElements = document.querySelectorAll('#solutions .project-box')
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

function hideVotingElements () {
  const votingElements = document.querySelectorAll('.not-voted')
  for (const votingElement of votingElements) {
    votingElement.classList.add('inactive')
  }
  const checkboxes = document.querySelectorAll('.checkmark')
  for (const checkbox of checkboxes) {
    checkbox.classList.add('inactive')
  }
}

const pages = document.querySelectorAll('.page')
const nav = {
  solutions: document.querySelector('#nav-solutions'),
  voters: document.querySelector('#nav-voters'),
  info: document.querySelector('#nav-info')
}

;(async () => {
  renderSolutions(solutions)
  installRouter(handleRouting)
  const serviceResponse = await fetch(config.serviceUrl, { credentials: 'include' })
  const serviceData = await serviceResponse.json()
  authProviders = serviceData.authProviders
  myVote = serviceData.vote
  let savedData = localStorage.getItem('data')
  if (savedData) {
    savedData = JSON.parse(savedData)
  }
  if (!myVote) {
    // not authenticated
    if (localStorage.getItem('myVote')) {
      localStorage.removeItem('myVote')
    }
    // TODO: if savedData should continue with voting
  } else if (myVote.solutions) {
    // already voted
    if (!localStorage.getItem('myVote')) localStorage.setItem('myVote', JSON.stringify(myVote))
    hideVotingElements()
  } else if (savedData) {
    // vote ready to submit
    myVote = Object.assign({}, myVote, savedData)
    const castedVoteResponse = await fetch(myVote.id, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(myVote)
    })
    if (castedVoteResponse.ok) {
      console.log('VOTE SUBMISSION SUCCEEDED')
      hideVotingElements()
      // draft
      localStorage.removeItem('data')
      const serviceResponse = await fetch(config.serviceUrl, { credentials: 'include' })
      const serviceData = await serviceResponse.json()
      myVote = serviceData.vote
      localStorage.setItem('myVote', JSON.stringify(myVote))
      handleRouting(window.location)
    } else {
      console.log('VOTE SUBMISSION FAILED')
      if (myVote) {
        hideVotingElements()
      }
    }
  } else {
    console.log('AUTHENTICATED BUT NO SAVED DATA')
  }
  const statsResponse = await fetch(`${config.serviceUrl}/stats`, { credentials: 'include' })
  const stats = await statsResponse.json()
  const countries = stats.country
  document.querySelector('#voters').addEventListener('click', unshave)
  renderVotes(stats)
  for await (const country of countries) {
    await new Promise(resolve => setTimeout(resolve))
    const element = document.querySelector(`#voters-${country.code}`)
    render(countryShortTemplate(country), element)
    if (active === 'voters' && !slug) shaveOpinions(element)
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
  } else if (!slug) {
    document.querySelector(`#${active}`).classList.remove('inactive')
  }
  renderHeader(linkedHeader)
  if (active === 'voters' && !slug) {
    const elements = document.querySelectorAll('#voters .country-votes')
    for await (const element of elements) {
      await new Promise(resolve => setTimeout(resolve))
      shaveOpinions(element)
    }
  }
  if (active === 'solutions') {
    nav['voters'].classList.add('active-prev')
    nav['solutions'].classList.add('active')
    if (!myVote && selectedSolutions.length === 3) {
      showForm()
    }
    if (myVote) hideVotingElements()
  }
  if (active === 'info') {
    nav['voters'].classList.add('active-prev')
    nav['solutions'].classList.add('active-prev')
    nav['info'].classList.add('active')
    if (myVote && myVote.nationality) {
      const template = html`
        <div class="my-vote info-box">Congratulations, you are voter # <strong>${myVote.index}</strong> from <strong>${countryName(myVote.nationality)}</strong></div>
        <div class="vertical-line-small"></div>
        ${countryShortTemplate({ code: myVote.nationality, vote: [myVote] })}
      `
      render(template, document.querySelector('#my-vote'))
    }
    if (myVote && myVote.newsletter === 'on') {
      document.querySelector('#newsletter').classList.add('inactive')
    }
  }
  if (active === 'voters' && slug) {
    nav['voters'].classList.add('active')
    let country = cache.find(c => c.code === slug)
    if (!country) {
      const countryResponse = await fetch(`${config.serviceUrl}/votes/${slug}`)
      country = await countryResponse.json()
      cache.push(country)
    }
    if (active !== 'voters') return // check again if route didn't change
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
      ${Object.keys(countries).sort((first, second) => countries[first] > countries[second]).map(code => html`
        <option value="${code.toLowerCase()}">${countries[code]} ${flag(code)}</option>
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
      <div class="info-box">
        We are curious about what would happen if people from around the world designed a <strong>concrete action plan</strong> against climate change
      </div>
      <div class="vertical-line-small"></div>
      <div class="info-box">
        In the Internet. <br> Without institutions.
      </div>
      <div class="vote-dance">
      <img src="img/m/group_1.png" style="width:21em; height:10em;">
      </div>
      <div class="vertical-line-small"></div>
      <div class="info-box">
        Your opinion can change things, and by each of us <strong>selecting 3 solutions to climate change</strong>,
        we can create a simple, yet powerful strategy chosen by people
      </div>
      <div class="vertical-line-small"></div>
      <div class="info-box">
        Thanks to the 200+ scientists and academics at <a href="https://www.drawdown.org/solutions-summary-by-rank" target="_blank">Drawdown</a>,
        we can share with you a list of the <strong>climate solutions with the biggest impact</strong>, here are the Top 15 by rank:
      </div>
      <div class="vertical-line-small not-voted"></div>
      <div class="info-box not-voted" style="text-align:center">
        <strong>SELECT 3</strong> 
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
  render(solutionsTemplate, document.querySelector('#solutions'))
}

function loadMoreLink (country) {
  if (country.count > PREVIEW_VOTES_COUNT) {
    return html`<a href="/voters/${country.code.toLowerCase()}"><i>load more ↓</i></a>`
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
